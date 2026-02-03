const puppeteer = require('puppeteer');
const crypto = require('crypto');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Event = require('../models/Event');
const connectDB = require('../config/db');

/**
 * Generate MD5 hash for event change detection
 */
const generateEventHash = (title, link) => {
    const content = `${title}${link}`;
    return crypto.createHash('md5').update(content).digest('hex');
};

// Placeholder image for events without images
const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400?text=Event';

/**
 * Scrape events from What's On Sydney using Title-First approach
 */
const scrapeEvents = async (limit = 10) => {
    console.log('🚀 Launching browser...');

    let browser;

    try {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'],
        });

        const page = await browser.newPage();

        const url = 'https://whatson.cityofsydney.nsw.gov.au/';
        console.log(`📍 Navigating to: ${url}`);

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Wait for H3 elements (event titles)
        console.log('⏳ Waiting for event titles (h3)...');
        await page.waitForSelector('h3', { timeout: 15000 });

        // Extra wait for dynamic content
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('🔍 Extracting events using Title-First approach...');

        const events = await page.evaluate((placeholderImg) => {
            const results = [];
            const h3Elements = document.querySelectorAll('h3');

            for (const h3 of h3Elements) {
                try {
                    const title = h3.textContent?.trim() || '';
                    if (!title || title.length < 3) continue;

                    let link = h3.closest('a');
                    if (!link) link = h3.querySelector('a');
                    if (!link) {
                        const parent = h3.parentElement;
                        if (parent) link = parent.querySelector('a') || parent.closest('a');
                    }
                    if (!link) continue;

                    const sourceUrl = link.href || '';
                    if (!sourceUrl || sourceUrl === '#' || sourceUrl.length < 10) continue;
                    if (sourceUrl.includes('facebook') || sourceUrl.includes('twitter') ||
                        sourceUrl.includes('instagram') || sourceUrl.includes('mailto:')) continue;

                    let image = '';
                    let imgEl = link.querySelector('img');
                    if (!imgEl) {
                        const card = link.closest('article, .card, .event, div');
                        if (card) imgEl = card.querySelector('img');
                    }
                    if (imgEl) {
                        image = imgEl.src || imgEl.dataset?.src || '';
                    }
                    if (!image) image = placeholderImg;

                    let date = 'Check Link for Date';
                    const card = link.closest('article, .card, .event, div');
                    if (card) {
                        const dateEl = card.querySelector('.date, time, [datetime]');
                        if (dateEl) {
                            date = dateEl.textContent?.trim() || dateEl.getAttribute('datetime') || date;
                        }
                    }

                    let description = '';
                    if (card) {
                        const descEl = card.querySelector('p, .description, .summary');
                        if (descEl && descEl !== h3) {
                            description = descEl.textContent?.trim() || '';
                        }
                    }

                    results.push({
                        title,
                        date,
                        venue: 'Sydney',
                        description: description.substring(0, 300),
                        image,
                        sourceUrl,
                    });

                } catch (e) {
                    continue;
                }
            }

            return results;
        }, PLACEHOLDER_IMAGE);

        console.log(`📊 Found ${events.length} potential events`);

        // Deduplicate by URL
        const uniqueEvents = [];
        const seenUrls = new Set();

        for (const event of events) {
            if (!seenUrls.has(event.sourceUrl)) {
                seenUrls.add(event.sourceUrl);
                uniqueEvents.push({
                    ...event,
                    eventHash: generateEventHash(event.title, event.sourceUrl),
                    sourceName: "What's On Sydney",
                    city: 'Sydney',
                });
            }
            if (uniqueEvents.length >= limit) break;
        }

        console.log(`✅ Scraped ${uniqueEvents.length} unique events`);
        return uniqueEvents;

    } catch (error) {
        console.error('❌ Scraping Error:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔒 Browser closed');
        }
    }
};

/**
 * Save scraped events to MongoDB with auto-update logic
 * - New events: status = 'new'
 * - Changed events: status = 'updated'
 * - Unchanged events: just update lastScrapedAt
 */
const saveEventsToDB = async () => {
    console.log('\n📦 Starting database sync...');

    // Scrape events
    const scrapedEvents = await scrapeEvents(20);

    if (scrapedEvents.length === 0) {
        console.log('⚠️ No events to save');
        return { added: 0, updated: 0, unchanged: 0 };
    }

    // Stats counters
    let added = 0;
    let updated = 0;
    let unchanged = 0;

    for (const event of scrapedEvents) {
        try {
            // Check if event exists by sourceUrl
            const existingEvent = await Event.findOne({ sourceUrl: event.sourceUrl });

            if (!existingEvent) {
                // Scenario A: New event
                await Event.create({
                    ...event,
                    status: 'new',
                    lastScrapedAt: new Date(),
                });
                added++;
                console.log(`  ➕ NEW: ${event.title.substring(0, 40)}...`);

            } else if (existingEvent.eventHash === event.eventHash) {
                // Scenario B: Exists and unchanged
                existingEvent.lastScrapedAt = new Date();
                await existingEvent.save();
                unchanged++;

            } else {
                // Scenario C: Exists but changed
                existingEvent.title = event.title;
                existingEvent.date = event.date;
                existingEvent.venue = event.venue;
                existingEvent.description = event.description;
                existingEvent.image = event.image;
                existingEvent.eventHash = event.eventHash;
                existingEvent.status = 'updated';
                existingEvent.lastScrapedAt = new Date();
                await existingEvent.save();
                updated++;
                console.log(`  🔄 UPDATED: ${event.title.substring(0, 40)}...`);
            }

        } catch (error) {
            console.error(`  ❌ Error saving "${event.title}":`, error.message);
        }
    }

    console.log('\n====================================');
    console.log('   📊 DATABASE SYNC RESULTS');
    console.log('====================================');
    console.log(`   ➕ Added:     ${added}`);
    console.log(`   🔄 Updated:   ${updated}`);
    console.log(`   ✓  Unchanged: ${unchanged}`);
    console.log(`   📦 Total:     ${added + updated + unchanged}`);
    console.log('====================================\n');

    return { added, updated, unchanged };
};

// Export functions
module.exports = { scrapeEvents, saveEventsToDB, generateEventHash };

// Self-invoking function for direct execution
(async () => {
    if (require.main === module) {
        console.log('\n================================================');
        console.log("   SYDNEY EVENTS SCRAPER + DB SYNC   ");
        console.log('================================================\n');

        try {
            // Connect to MongoDB
            await connectDB();

            // Run scraper and save to DB
            await saveEventsToDB();

            // Disconnect
            await mongoose.disconnect();
            console.log('🔌 MongoDB disconnected');

        } catch (error) {
            console.error('FATAL:', error.message);
            process.exit(1);
        }
    }
})();
