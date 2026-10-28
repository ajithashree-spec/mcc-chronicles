const pool = require('../config/db');

async function seedRecentArticles() {
  console.log('Seeding recent published articles for dynamic hero slideshow and broadsheet...');

  // Update existing article 5 to published with clean title and subheading
  await pool.query(`
    UPDATE articles SET 
      title = 'Historic Anderson Tower & Quadrangle Restorations Safeguard Decades of Heritage',
      slug = 'historic-anderson-tower-restorations',
      summary = 'Comprehensive masonry preservation and rare archive digitization ensure centuries of collegiate liberal arts traditions endure.',
      content = 'The Governing Board and Department of History have announced the successful completion of phase one restorative works across the Anderson clock tower and quadrangle pathways. Combining authentic lime-plaster conservation with modern climate-controlled archival vaults, the initiative safeguards over 180 years of collegiate documents.',
      cover_image = '/images/mcc-heritage-facade-hd.jpg',
      category_id = 1,
      status = 'published',
      is_featured = 1,
      published_at = NOW() - INTERVAL 1 HOUR
    WHERE id = 5
  `);

  const articles = [
    {
      title: 'Autonomous Academic Council Approves Interdisciplinary AI & Quantum Research Bureaus',
      slug: 'academic-council-approves-interdisciplinary-research-bureaus',
      summary: 'New multidisciplinary laboratories bridge liberal arts scholarship with cutting-edge computing across both Shift I and Shift II departments.',
      content: 'In a landmark session held at the Miller Memorial quadrangle, the Academic Council of Madras Christian College unanimously ratified the establishment of twin research bureaus dedicated to Quantum Information and Ethics in Artificial Intelligence. The bureaus will coordinate faculty research fellows and student scholars.',
      cover_image: '/images/mcc-academic-quad-hd.jpg',
      category_id: 5,
      department_id: 13,
      author_id: 99,
      status: 'published',
      is_breaking: 1,
      is_featured: 1,
      offsetHours: 2,
    },
    {
      title: 'Annual Cultural Festival Deepwoods Celebrates Golden Jubilee Across Scrub Jungle Sanctuary',
      slug: 'annual-cultural-festival-deepwoods-golden-jubilee',
      summary: 'Over 8,000 collegiate delegates from institutions nationwide gather for literary conclaves, music assemblies, and fine arts pageants.',
      content: 'Deepwoods 2026 commenced this morning with ceremonial fanfare across the iconic open-air quadrangle. Featuring over forty intercollegiate competitions spanning debate, theatrical drama, and forensic acoustics, the festival marks fifty years of collegiate student fellowship.',
      cover_image: '/images/mcc-campus-hero-hd.jpg',
      category_id: 4,
      department_id: 12,
      author_id: 99,
      status: 'published',
      is_breaking: 0,
      is_featured: 1,
      offsetHours: 5,
    },
    {
      title: 'MCC Athletics Contingent Lifts University Championship Trophy in Tri-Centenary Match',
      slug: 'mcc-athletics-lifts-championship-trophy',
      summary: 'Record-breaking performances in track and field lead Tambaram athletes to a historic victory at the Madras Inter-Collegiate Finals.',
      content: 'Displaying relentless grit and disciplined sportsmanship, the Madras Christian College athletic squad clinched the overall rolling championship trophy at the Jawaharlal Nehru Stadium. Gold medals in 400m hurdles, high jump, and relay secured the title for the college.',
      cover_image: '/images/mcc-historic-hall-hd.jpg',
      category_id: 3,
      department_id: 15,
      author_id: 99,
      status: 'published',
      is_breaking: 0,
      is_featured: 1,
      offsetHours: 8,
    },
    {
      title: 'International Ecological Conclave Discovers Three Endemic Flora Species in Tambaram Reserve',
      slug: 'international-ecological-conclave-discovers-flora',
      summary: 'Faculty botanists and student researchers document unique scrub jungle biodiversity during an intensive 365-acre ecological audit.',
      content: 'A peer-reviewed survey conducted by the Department of Plant Biology & Plant Biotechnology has uncovered three previously unclassified micro-flora species inhabiting the interior canopy of the 365-acre campus sanctuary. The findings will be published in the international botanic journal.',
      cover_image: '/images/mcc-scrub-jungle-hd.jpg',
      category_id: 2,
      department_id: 13,
      author_id: 99,
      status: 'published',
      is_breaking: 1,
      is_featured: 1,
      offsetHours: 12,
    },
  ];

  for (const art of articles) {
    const [existing] = await pool.query('SELECT id FROM articles WHERE slug = ?', [art.slug]);
    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO articles 
          (title, slug, summary, content, cover_image, category_id, department_id, author_id, status, is_breaking, is_featured, published_at, created_at)
         VALUES 
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL ? HOUR, NOW() - INTERVAL ? HOUR)`,
        [
          art.title,
          art.slug,
          art.summary,
          art.content,
          art.cover_image,
          art.category_id,
          art.department_id || null,
          art.author_id,
          art.status,
          art.is_breaking,
          art.is_featured,
          art.offsetHours,
          art.offsetHours,
        ]
      );
      console.log(`✓ Inserted published article: "${art.title}"`);
    } else {
      await pool.query(
        `UPDATE articles SET 
          title = ?, summary = ?, content = ?, cover_image = ?, category_id = ?, status = 'published', published_at = NOW() - INTERVAL ? HOUR
         WHERE id = ?`,
        [art.title, art.summary, art.content, art.cover_image, art.category_id, art.offsetHours, existing[0].id]
      );
      console.log(`✓ Updated article: "${art.title}"`);
    }
  }

  console.log('Seeding completed successfully!');
  process.exit(0);
}

seedRecentArticles().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
