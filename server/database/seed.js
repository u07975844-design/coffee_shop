import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import pool from '../src/config/db.js';

const HERO_IMG = '/src/assets/images/hero_coffee_roastery_1795667817953.jpg';
const ESPRESSO_IMG = '/src/assets/images/product_espresso_latte_1795667818167.jpg';
const COLD_BREW_IMG = '/src/assets/images/product_cold_brew_1795667820360.jpg';
const POUR_OVER_IMG = '/src/assets/images/product_pour_over_1795667818364.jpg';
const PASTRY_IMG = '/src/assets/images/product_artisan_pastry_1795667818339.jpg';

async function seed() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Admin Account from Environment Variables
    const adminName = env.admin.name;
    const adminEmail = env.admin.email.toLowerCase();
    const adminPassword = env.admin.password;

    if (!adminEmail || !adminPassword || adminPassword === 'change_me') {
      throw new Error('Please configure ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before running the seed script.');
    }

    const adminHash = await bcrypt.hash(adminPassword, 12);

    const [existingAdmins] = await connection.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [adminEmail]
    );

    let adminId;
    if (existingAdmins.length > 0) {
      adminId = existingAdmins[0].id;
      await connection.query(
        'UPDATE users SET name = ?, password_hash = ?, role = "admin", is_active = 1 WHERE id = ?',
        [adminName, adminHash, adminId]
      );
    } else {
      const [adminInsert] = await connection.query(
        'INSERT INTO users (name, email, password_hash, phone, role, is_active) VALUES (?, ?, ?, ?, "admin", 1)',
        [adminName, adminEmail, adminHash, '+92 300 4128900']
      );
      adminId = adminInsert.insertId;
    }

    // Seed a clearly labeled demo reviewer user for sample reviews (locked account)
    const sampleGuestEmail = 'sample.guest@roastandreverie.local';
    const [existingSampleGuests] = await connection.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [sampleGuestEmail]
    );
    let sampleUserId;
    if (existingSampleGuests.length > 0) {
      sampleUserId = existingSampleGuests[0].id;
    } else {
      const sampleHash = await bcrypt.hash('SampleGuest#2026!', 10);
      const [guestInsert] = await connection.query(
        'INSERT INTO users (name, email, password_hash, phone, role, is_active) VALUES (?, ?, ?, ?, "customer", 0)',
        ['Ayesha Khan (Sample Guest)', sampleGuestEmail, sampleHash, '+92 321 0000000']
      );
      sampleUserId = guestInsert.insertId;
    }

    // 2. Café Settings
    const openingHours = [
      { day: 'Monday – Thursday', hours: '7:30 AM – 10:30 PM' },
      { day: 'Friday', hours: '8:00 AM – 11:30 PM' },
      { day: 'Saturday – Sunday', hours: '8:30 AM – 11:30 PM' },
    ];
    const socialLinks = {
      instagram: 'https://instagram.com/roastandreverie',
      facebook: 'https://facebook.com/roastandreverie',
      x: 'https://x.com/roastandreverie',
    };

    await connection.query(
      `INSERT INTO cafe_settings (
        id, shop_name, tagline, logo_url, established_year,
        about_title, about_story, contact_phone, contact_email, address,
        opening_hours_json, social_links_json, hero_title, hero_subtitle,
        hero_image_url, footer_note, currency_code
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      ) ON DUPLICATE KEY UPDATE
        shop_name = VALUES(shop_name),
        tagline = VALUES(tagline),
        established_year = VALUES(established_year),
        currency_code = VALUES(currency_code)`,
      [
        'Roast & Reverie',
        'Small-Batch Craft Roastery & Specialty Espresso Bar',
        HERO_IMG,
        'Est. 2019',
        'Slow Roasting. Honest Sourcing. Quiet Craft.',
        'Founded in Lahore in 2019, Roast & Reverie began around a single cast-iron drum roaster and a belief that daily coffee deserves unhurried care. We roast high-elevation Arabica micro-lots in small weekly batches, pair every espresso shot with organic farm dairy or barista oat milk, and bake laminated viennoiserie fresh each morning.',
        '+92 42 3578 9042',
        'hello@roastandreverie.pk',
        '14-B Zafar Ali Road, Gulberg V, Lahore',
        JSON.stringify(openingHours),
        JSON.stringify(socialLinks),
        'Small-Batch Coffee Roasted for Unhurried Mornings',
        'Single-origin pour-overs, velvet espresso drinks, slow-steeped cold brews, and warm morning pastries crafted daily in Lahore.',
        HERO_IMG,
        'Roasted weekly in Gulberg V, Lahore. Prepared fresh to order for pickup and local delivery.',
        env.currencyCode || 'PKR',
      ]
    );

    // 3. Categories
    const categories = [
      {
        name: 'Signature Espresso',
        slug: 'signature-espresso',
        description: 'Velvety microfoam, house caramel reductions, and double-ristretto espresso classics.',
        image_url: ESPRESSO_IMG,
        sort_order: 1,
      },
      {
        name: 'Cold Brew & Iced',
        slug: 'cold-brew-iced',
        description: '18-hour cold extractions, shaken iced lattes, and tonic infusions served over crystal ice.',
        image_url: COLD_BREW_IMG,
        sort_order: 2,
      },
      {
        name: 'Single-Origin Pour-Over',
        slug: 'single-origin-pour-over',
        description: 'Hand-brewed V60 and Chemex filter coffees showcasing bright floral and stone-fruit terroir.',
        image_url: POUR_OVER_IMG,
        sort_order: 3,
      },
      {
        name: 'Artisanal Pastries',
        slug: 'artisanal-pastries',
        description: 'Cultured-butter croissants, cardamom knots, and espresso ganache tarts baked every dawn.',
        image_url: PASTRY_IMG,
        sort_order: 4,
      },
      {
        name: 'Roasted Whole Beans',
        slug: 'roasted-whole-beans',
        description: '250g nitrogen-flushed bags of our seasonal house blends and single-estate harvests.',
        image_url: POUR_OVER_IMG,
        sort_order: 5,
      },
    ];

    const categoryMap = {};
    for (const cat of categories) {
      await connection.query(
        `INSERT INTO categories (name, slug, description, image_url, sort_order, is_active, is_archived)
         VALUES (?, ?, ?, ?, ?, 1, 0)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           description = VALUES(description),
           image_url = VALUES(image_url),
           sort_order = VALUES(sort_order)`,
        [cat.name, cat.slug, cat.description, cat.image_url, cat.sort_order]
      );
      const [rows] = await connection.query('SELECT id FROM categories WHERE slug = ? LIMIT 1', [cat.slug]);
      categoryMap[cat.slug] = rows[0].id;
    }

    // 4. Products & Options
    const products = [
      {
        category: 'signature-espresso',
        name: 'Burnt Caramel Cortado',
        slug: 'burnt-caramel-cortado',
        description: 'Double ristretto pulled from our Gulberg House Blend, balanced with equal parts textured whole milk and house-simmered sea-salt caramel.',
        tasting_notes: 'Toasted caramel, dark cacao, velvet cream',
        origin: 'Colombia & Brazil Blend',
        image_url: ESPRESSO_IMG,
        base_price: 780.0,
        stock_quantity: 48,
        low_stock_threshold: 10,
        is_featured: 1,
        is_bestseller: 1,
        options: [
          { group: 'Size', name: 'Classic (6 oz)', delta: 0 },
          { group: 'Size', name: 'Double Cup (10 oz)', delta: 180 },
          { group: 'Milk Type', name: 'Organic Whole Milk', delta: 0 },
          { group: 'Milk Type', name: 'Barista Oat Milk', delta: 160 },
          { group: 'Milk Type', name: 'Almond Milk', delta: 150 },
          { group: 'Extra Shots', name: 'Standard Double Shot', delta: 0 },
          { group: 'Extra Shots', name: '+1 Extra Espresso Shot', delta: 190 },
        ],
      },
      {
        category: 'signature-espresso',
        name: 'Cardamom Brown Sugar Latte',
        slug: 'cardamom-brown-sugar-latte',
        description: 'Aromatic crushed green cardamom steeped in muscovado syrup, folded into silky steamed milk and rich espresso.',
        tasting_notes: 'Green cardamom, warm molasses, roasted hazelnut',
        origin: 'Guatemala Huehuetenango',
        image_url: ESPRESSO_IMG,
        base_price: 890.0,
        stock_quantity: 40,
        low_stock_threshold: 10,
        is_featured: 1,
        is_bestseller: 1,
        options: [
          { group: 'Size', name: 'Regular (8 oz)', delta: 0 },
          { group: 'Size', name: 'Large (12 oz)', delta: 190 },
          { group: 'Milk Type', name: 'Organic Whole Milk', delta: 0 },
          { group: 'Milk Type', name: 'Barista Oat Milk', delta: 160 },
          { group: 'Extra Shots', name: 'Standard Double Shot', delta: 0 },
          { group: 'Extra Shots', name: '+1 Extra Espresso Shot', delta: 190 },
        ],
      },
      {
        category: 'signature-espresso',
        name: 'Velvet Flat White',
        slug: 'velvet-flat-white',
        description: 'Pure micro-textured milk poured over 19 grams of precision-extracted espresso for a balanced, syrupy finish.',
        tasting_notes: 'Milk chocolate, roasted almond, sweet crema',
        origin: 'Ethiopia & Colombia Blend',
        image_url: ESPRESSO_IMG,
        base_price: 720.0,
        stock_quantity: 55,
        low_stock_threshold: 12,
        is_featured: 0,
        is_bestseller: 1,
        options: [
          { group: 'Size', name: 'Standard (7 oz)', delta: 0 },
          { group: 'Milk Type', name: 'Organic Whole Milk', delta: 0 },
          { group: 'Milk Type', name: 'Barista Oat Milk', delta: 160 },
          { group: 'Extra Shots', name: 'Standard Double Shot', delta: 0 },
          { group: 'Extra Shots', name: '+1 Extra Espresso Shot', delta: 190 },
        ],
      },
      {
        category: 'cold-brew-iced',
        name: '18-Hour Vanilla Cream Cold Brew',
        slug: '18-hour-vanilla-cream-cold-brew',
        description: 'Coarse-ground Kenyan and Brazilian beans steeped cold for 18 hours, crowned with lightly whipped Madagascar vanilla cream.',
        tasting_notes: 'Blackcurrant, sweet vanilla bean, dark cocoa',
        origin: 'Kenya Nyeri & Brazil Cerrado',
        image_url: COLD_BREW_IMG,
        base_price: 850.0,
        stock_quantity: 32,
        low_stock_threshold: 8,
        is_featured: 1,
        is_bestseller: 1,
        options: [
          { group: 'Size', name: 'Tall (12 oz)', delta: 0 },
          { group: 'Size', name: 'Carafe Bottle (500 ml)', delta: 450, track_stock: 1, stock_quantity: 9, low_stock_threshold: 4 },
          { group: 'Milk Type', name: 'Vanilla Sweet Cream', delta: 0 },
          { group: 'Milk Type', name: 'Oat Cream Float', delta: 150 },
        ],
      },
      {
        category: 'cold-brew-iced',
        name: 'Shaken Espresso & Cascara Tonic',
        slug: 'shaken-espresso-cascara-tonic',
        description: 'Fresh double espresso shaken over ice with botanical tonic water and dried coffee cherry cascara reduction.',
        tasting_notes: 'Blood orange peel, hibiscus, crisp espresso',
        origin: 'Costa Rica Tarrazu',
        image_url: COLD_BREW_IMG,
        base_price: 820.0,
        stock_quantity: 28,
        low_stock_threshold: 8,
        is_featured: 0,
        is_bestseller: 0,
        options: [
          { group: 'Size', name: 'Standard (12 oz)', delta: 0 },
          { group: 'Extra Shots', name: 'Standard Double Shot', delta: 0 },
          { group: 'Extra Shots', name: '+1 Extra Espresso Shot', delta: 190 },
        ],
      },
      {
        category: 'cold-brew-iced',
        name: 'Iced Hazelnut Praline Mocha',
        slug: 'iced-hazelnut-praline-mocha',
        description: 'Stone-ground dark chocolate ganache and roasted Piedmont hazelnut praline whisked with chilled espresso over ice.',
        tasting_notes: 'Roasted hazelnut, 70% dark chocolate, caramel',
        origin: 'Brazil Mogiana',
        image_url: COLD_BREW_IMG,
        base_price: 940.0,
        stock_quantity: 30,
        low_stock_threshold: 8,
        is_featured: 1,
        is_bestseller: 0,
        options: [
          { group: 'Size', name: 'Regular (12 oz)', delta: 0 },
          { group: 'Size', name: 'Large (16 oz)', delta: 210 },
          { group: 'Milk Type', name: 'Whole Milk', delta: 0 },
          { group: 'Milk Type', name: 'Barista Oat Milk', delta: 160 },
        ],
      },
      {
        category: 'single-origin-pour-over',
        name: 'Ethiopia Yirgacheffe V60',
        slug: 'ethiopia-yirgacheffe-v60',
        description: 'Washed high-altitude heirloom beans brewed by hand to order for sparkling clarity and jasmine aromatics.',
        tasting_notes: 'Jasmine blossom, white peach, bergamot tea',
        origin: 'Gedeb, Yirgacheffe (2,100m)',
        image_url: POUR_OVER_IMG,
        base_price: 920.0,
        stock_quantity: 22,
        low_stock_threshold: 6,
        is_featured: 1,
        is_bestseller: 0,
        options: [
          { group: 'Size', name: 'Single Cup (250 ml)', delta: 0 },
          { group: 'Size', name: 'Glass Carafe for Two (500 ml)', delta: 640 },
        ],
      },
      {
        category: 'single-origin-pour-over',
        name: 'Colombia El Paraiso Honey Filter',
        slug: 'colombia-el-paraiso-honey-filter',
        description: 'Honey-processed Caturra micro-lot offering balanced orchard sweetness and a lingering spiced finish.',
        tasting_notes: 'Baked apricot, panela sugar, sweet almond',
        origin: 'Cauca, Colombia (1,850m)',
        image_url: POUR_OVER_IMG,
        base_price: 960.0,
        stock_quantity: 7,
        low_stock_threshold: 8,
        is_featured: 0,
        is_bestseller: 0,
        options: [
          { group: 'Size', name: 'Single Cup (250 ml)', delta: 0 },
          { group: 'Size', name: 'Glass Carafe for Two (500 ml)', delta: 680 },
        ],
      },
      {
        category: 'artisanal-pastries',
        name: 'Cultured Butter Almond Croissant',
        slug: 'cultured-butter-almond-croissant',
        description: '72-hour fermented laminated dough filled with toasted almond frangipane and finished with flaked almonds.',
        tasting_notes: 'Browned butter, roasted almond, flaky layers',
        origin: 'In-House Bakery',
        image_url: PASTRY_IMG,
        base_price: 680.0,
        stock_quantity: 24,
        low_stock_threshold: 6,
        is_featured: 1,
        is_bestseller: 1,
        options: [
          { group: 'Size', name: 'Single Pastry', delta: 0 },
          { group: 'Size', name: 'Warm Gift Box of 2', delta: 620 },
        ],
      },
      {
        category: 'artisanal-pastries',
        name: 'Dark Espresso Ganache Tart',
        slug: 'dark-espresso-ganache-tart',
        description: 'Crisp cocoa sablé shell filled with single-origin espresso-infused 70% dark chocolate ganache and sea salt.',
        tasting_notes: 'Bittersweet cocoa, espresso crema, flaky sea salt',
        origin: 'In-House Bakery',
        image_url: PASTRY_IMG,
        base_price: 790.0,
        stock_quantity: 18,
        low_stock_threshold: 5,
        is_featured: 0,
        is_bestseller: 1,
        options: [
          { group: 'Size', name: 'Individual Tart Slice', delta: 0 },
        ],
      },
      {
        category: 'roasted-whole-beans',
        name: 'Gulberg House Espresso Roast (250g)',
        slug: 'gulberg-house-espresso-roast-250g',
        description: 'Our signature medium-dark omni-roast developed for rich crema, low acidity, and effortless home espresso or moka pot brewing.',
        tasting_notes: 'Dark caramel, cocoa nibs, roasted walnut',
        origin: 'Colombia & Brazil (250g Bag)',
        image_url: POUR_OVER_IMG,
        base_price: 2650.0,
        stock_quantity: 19,
        low_stock_threshold: 6,
        is_featured: 1,
        is_bestseller: 0,
        options: [
          { group: 'Grind', name: 'Whole Bean', delta: 0, track_stock: 1, stock_quantity: 12, low_stock_threshold: 4 },
          { group: 'Grind', name: 'Espresso Fine Grind', delta: 0, track_stock: 1, stock_quantity: 5, low_stock_threshold: 3 },
          { group: 'Grind', name: 'Pour-Over Medium Grind', delta: 0, track_stock: 1, stock_quantity: 4, low_stock_threshold: 3 },
        ],
      },
      {
        category: 'roasted-whole-beans',
        name: 'Gedeb Highlands Reserve (250g)',
        slug: 'gedeb-highlands-reserve-250g',
        description: 'Light-medium filter roast roasted on Tuesdays for vibrant citrus aromatics and floral sweetness.',
        tasting_notes: 'Bergamot, nectarine, honeysuckle',
        origin: 'Ethiopia (250g Bag)',
        image_url: POUR_OVER_IMG,
        base_price: 3100.0,
        stock_quantity: 5,
        low_stock_threshold: 6,
        is_featured: 0,
        is_bestseller: 0,
        options: [
          { group: 'Grind', name: 'Whole Bean', delta: 0 },
          { group: 'Grind', name: 'V60 / Pour-Over Grind', delta: 0 },
        ],
      },
    ];

    const productIds = [];
    for (const prod of products) {
      const catId = categoryMap[prod.category];
      await connection.query(
        `INSERT INTO products (
          category_id, name, slug, description, tasting_notes, origin,
          image_url, base_price, stock_quantity, low_stock_threshold,
          is_featured, is_bestseller, is_available, is_archived
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          base_price = VALUES(base_price)`,
        [
          catId,
          prod.name,
          prod.slug,
          prod.description,
          prod.tasting_notes,
          prod.origin,
          prod.image_url,
          prod.base_price,
          prod.stock_quantity,
          prod.low_stock_threshold,
          prod.is_featured,
          prod.is_bestseller,
        ]
      );

      const [prodRows] = await connection.query('SELECT id, stock_quantity FROM products WHERE slug = ? LIMIT 1', [prod.slug]);
      const productId = prodRows[0].id;
      productIds.push({ id: productId, name: prod.name, stock: prodRows[0].stock_quantity });

      const [existingOpts] = await connection.query('SELECT id FROM product_options WHERE product_id = ? LIMIT 1', [productId]);
      if (existingOpts.length === 0 && prod.options?.length) {
        let sortIdx = 1;
        for (const opt of prod.options) {
          await connection.query(
            `INSERT INTO product_options (
              product_id, option_group, option_name, price_delta,
              track_stock, stock_quantity, low_stock_threshold, is_available, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [
              productId,
              opt.group,
              opt.name,
              opt.delta || 0,
              opt.track_stock ? 1 : 0,
              opt.stock_quantity ?? 0,
              opt.low_stock_threshold ?? 5,
              sortIdx++,
            ]
          );
        }
      }

      const [existingMov] = await connection.query(
        'SELECT id FROM inventory_movements WHERE product_id = ? LIMIT 1',
        [productId]
      );
      if (existingMov.length === 0) {
        await connection.query(
          `INSERT INTO inventory_movements (
            product_id, movement_type, quantity_change, previous_stock, new_stock, reason, created_by
          ) VALUES (?, 'Stock Added', ?, 0, ?, 'Initial catalog seed stock', ?)`,
          [productId, prod.stock_quantity, prod.stock_quantity, adminId]
        );
      }
    }

    // 5. Active Offers
    const now = new Date();
    const startsAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const expiresAt90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const offers = [
      {
        title: 'Roastery Welcome — 15% Off Your First Order',
        description: 'Enjoy 15% off across espresso drinks, single-origin pour-overs, and house pastries on orders above PKR 1,500.',
        coupon_code: 'REVERIE15',
        discount_type: 'percentage',
        discount_value: 15.0,
        min_order_amount: 1500.0,
      },
      {
        title: 'Morning Pastry Pairing — PKR 250 Off',
        description: 'Save PKR 250 when ordering coffee and warm laminated pastries together above PKR 1,800.',
        coupon_code: 'MORNING250',
        discount_type: 'fixed',
        discount_value: 250.0,
        min_order_amount: 1800.0,
      },
    ];

    for (const offer of offers) {
      await connection.query(
        `INSERT INTO offers (
          title, description, coupon_code, discount_type, discount_value,
          min_order_amount, starts_at, expires_at, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          description = VALUES(description),
          expires_at = VALUES(expires_at),
          is_active = 1`,
        [
          offer.title,
          offer.description,
          offer.coupon_code,
          offer.discount_type,
          offer.discount_value,
          offer.min_order_amount,
          startsAt,
          expiresAt90,
        ]
      );
    }

    // 6. Clearly Identified Sample Reviews (Demo Reviews)
    const [existingSampleReviews] = await connection.query(
      'SELECT id FROM reviews WHERE is_sample = 1 LIMIT 1'
    );
    if (existingSampleReviews.length === 0 && productIds.length >= 4) {
      const sampleReviews = [
        {
          product_id: productIds[0].id,
          display_name: 'Ayesha Khan (Sample Review)',
          rating: 5,
          comment: 'Sample review: The Burnt Caramel Cortado has a genuinely balanced roast without tasting overly sweet. Silky texture every morning.',
        },
        {
          product_id: productIds[3].id,
          display_name: 'Zain Tariq (Sample Review)',
          rating: 5,
          comment: 'Sample review: Smooth 18-hour cold brew with rich cacao notes. The 500 ml bottle keeps wonderfully for weekend mornings.',
        },
        {
          product_id: productIds[6].id,
          display_name: 'Mahnoor Raza (Sample Review)',
          rating: 5,
          comment: 'Sample review: Bright bergamot and stone-fruit aromatics on the Ethiopia Yirgacheffe V60. Cleanest filter cup in Lahore.',
        },
        {
          product_id: productIds[8].id,
          display_name: 'Hamza Siddiqui (Sample Review)',
          rating: 4,
          comment: 'Sample review: Crisp laminated layers and fragrant almond frangipane—still warm when picked up at 8:30 AM.',
        },
      ];

      for (const rev of sampleReviews) {
        await connection.query(
          `INSERT INTO reviews (
            user_id, product_id, order_item_id, display_name, rating, comment, status, is_sample
          ) VALUES (?, ?, NULL, ?, ?, ?, 'approved', 1)`,
          [sampleUserId, rev.product_id, rev.display_name, rev.rating, rev.comment]
        );
      }
    }

    await connection.commit();
    console.log('Seed completed successfully.');
    console.log(`Admin login email: ${adminEmail}`);
    console.log('Categories seeded:', categories.length);
    console.log('Products seeded:', products.length);
    console.log('Sample reviews seeded with is_sample=1.');
  } catch (err) {
    await connection.rollback();
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed();
