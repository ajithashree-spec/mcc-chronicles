import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../hooks/useArticles';
import articleService from '../services/articleService';
import LeadStory from '../components/broadsheet/LeadStory';
import StoryGrid from '../components/broadsheet/StoryGrid';
import EditorialColumn from '../components/broadsheet/EditorialColumn';
import BreakingTicker from '../components/broadsheet/BreakingTicker';
import NewsletterBox from '../components/common/NewsletterBox';
import PollWidget from '../components/common/PollWidget';
import { ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';

const FALLBACK_LEAD_STORY = {
  id: 'fallback-lead',
  slug: 'centennial-celebrations-anderson-quadrangle-research-grants',
  title:
    'Centennial Celebrations in Anderson Quadrangle: 187th Academic Year Commences with Major Interdisciplinary Research Grants',
  summary:
    'Faculty and scholars unveil six flagship environmental and digital humanities labs across the 365-acre scrub jungle campus, continuing Madras Christian College’s historic pursuit of truth, freedom, and excellence.',
  content:
    'In a landmark convocation held under the ancient rain trees of the historic Tambaram campus, the Governing Board alongside academic deans announced the formal inauguration of the 2026-2027 Research Initiative. The multi-departmental consortium brings together scholars from English, History, Botany, Mathematics, and Computer Science to document two centuries of biodiversity and literary culture in Southern India.\n\n"Madras Christian College has never been merely a center of instruction; it has forever stood as a sanctuary of thoughtful engagement with society," remarked the Principal during the keynote address in the Miller Memorial Quadrangle.',
  cover_image:
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200',
  category_name: 'Campus Spotlight',
  author_name: 'MCC Editorial Board',
  department_name: 'Administration',
  published_at: '2026-10-05T06:00:00Z',
};

const FALLBACK_SECONDARY_STORIES = [
  {
    id: 'sec-1',
    slug: 'botany-department-rare-medicinal-flora-discovery',
    title:
      'Botany Department Discovers Rare Medicinal Flora in Southern Scrub Woodland',
    summary:
      'Collaborative field research spanning three decades identifies previously uncatalogued medicinal plant varieties flourishing within the college sanctuary.',
    cover_image:
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800',
    category_name: 'Science & Research',
    author_name: 'Dr. E. Botany',
    published_at: '2026-10-04T08:30:00Z',
  },
  {
    id: 'sec-2',
    slug: 'deepwoods-2026-concert-finale-lineup-announced',
    title:
      'DeepWoods 2026 Concert Lineup: Legendary Woods Stage to Host National Bands',
    summary:
      'The cultural committee reveals the headline performances for the 46th edition of South India’s most anticipated collegiate festival.',
    cover_image:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    category_name: 'DeepWoods 2026',
    author_name: 'Cultural Desk',
    published_at: '2026-10-03T11:00:00Z',
  },
  {
    id: 'sec-3',
    slug: 'inter-hall-forensic-debate-symposium-scheduled',
    title:
      'Selaiyur, St. Thomas’s, and Bishop Heber Halls Prepare for Inter-Hall Forensic Debate',
    summary:
      'Traditional collegiate rivalry resumes this Friday as resident scholars gather for the annual parliamentary-style debate tournament.',
    cover_image:
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
    category_name: 'Halls of Residence',
    author_name: 'Student Union Reporter',
    published_at: '2026-10-02T14:15:00Z',
  },
  {
    id: 'sec-4',
    slug: 'mcc-cricket-eleven-bertram-trophy-victory',
    title:
      'MCC Cricket Eleven Triumphs in Inter-Collegiate Bertram Trophy Match',
    summary:
      'A commanding bowling performance in the final overs seals victory for the maroon and navy colors in the historic tournament.',
    cover_image:
      'https://images.unsplash.com/photo-1531415074868-036b107e775a?w=800',
    category_name: 'Sports Desk',
    author_name: 'Athletics Correspondent',
    published_at: '2026-10-01T16:00:00Z',
  },
];

const FALLBACK_CIRCULARS = [
  {
    id: 'circ-1',
    circular_number: 'MCC/COE/2026/04',
    title: 'End Semester Examination Time Table & Instructions (November 2026)',
    publish_date: '2026-10-01T00:00:00Z',
    attachment_url: '#',
  },
  {
    id: 'circ-2',
    circular_number: 'MCC/ACAD/2026/12',
    title: 'Annual Convocation 2026 Registration Notice for Graduands',
    publish_date: '2026-09-28T00:00:00Z',
    attachment_url: '#',
  },
];

function BroadsheetSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-9 bg-mcc-maroon/10 rounded w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-10 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-80 bg-gray-200 rounded w-full" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="h-40 bg-gray-200 rounded" />
          <div className="h-60 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { articles, loading, error, refetch } = useArticles({ limit: 12 });
  const [circulars, setCirculars] = useState([]);

  useEffect(() => {
    let isMounted = true;
    articleService
      .getCirculars(5)
      .then((res) => {
        if (isMounted) {
          setCirculars(Array.isArray(res.data) && res.data.length > 0 ? res.data : FALLBACK_CIRCULARS);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCirculars(FALLBACK_CIRCULARS);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading && (!articles || articles.length === 0)) {
    return <BroadsheetSkeleton />;
  }

  // Derive lead, secondary, and popular articles (merging with fallbacks if database has few records)
  const leadArticle =
    articles && articles.length > 0 ? articles[0] : FALLBACK_LEAD_STORY;

  const secondaryArticles =
    articles && articles.length > 1
      ? articles.slice(1, 5)
      : FALLBACK_SECONDARY_STORIES;

  const popularArticles =
    articles && articles.length > 0 ? articles : [leadArticle, ...FALLBACK_SECONDARY_STORIES];

  const tickerBulletins =
    circulars && circulars.length > 0
      ? circulars.slice(0, 4).map((c) => ({
          id: c.id,
          text: `${c.circular_number || 'GAZETTE'}: ${c.title}`,
          link: '/circulars',
          category: 'Gazette',
        }))
      : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. LIVE BREAKING DISPATCH TICKER */}
      <BreakingTicker items={tickerBulletins} />

      {/* 2. GRAND LEAD STORY & BROADSHEET COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b-2 border-mcc-maroon/20 pb-8">
        {/* Main Center-Left Editorial Feature (8 cols) */}
        <section className="lg:col-span-8 lg:border-r border-mcc-navy/15 lg:pr-8 space-y-6">
          <LeadStory article={leadArticle} />
          <StoryGrid articles={secondaryArticles} />
        </section>

        {/* Right Broadsheet Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <EditorialColumn
            popularArticles={popularArticles}
            circulars={circulars}
          />
          <PollWidget />
        </div>
      </div>

      {/* 3. THREE-COLUMN BROADSHEET DIGEST ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Column 1 */}
        <div className="space-y-3 border-t-2 border-mcc-maroon pt-3">
          <span className="text-xs font-serif font-bold text-mcc-maroon uppercase tracking-widest">
            Academics & Science
          </span>
          <h3 className="text-lg font-serif font-bold text-gray-900 leading-snug hover:text-mcc-maroon cursor-pointer">
            <Link to="/category/academics">
              Botany Department Discovers Rare Medicinal Flora in the Southern scrub jungle habitat
            </Link>
          </h3>
          <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed font-serif">
            Collaborative field research spanning three decades identifies previously uncatalogued medicinal plant varieties flourishing within the college sanctuary.
          </p>
        </div>

        {/* Column 2 */}
        <div className="space-y-3 border-t-2 border-mcc-navy pt-3">
          <span className="text-xs font-serif font-bold text-mcc-navy uppercase tracking-widest">
            Halls of Residence
          </span>
          <h3 className="text-lg font-serif font-bold text-gray-900 leading-snug hover:text-mcc-maroon cursor-pointer">
            <Link to="/category/campus-news">
              Selaiyur, St. Thomas&apos;s, and Bishop Heber Halls Prepare for Inter-Hall Debate Fest
            </Link>
          </h3>
          <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed font-serif">
            Traditional rivalry resumes on Friday as resident scholars gather for the annual parliamentary-style forensic symposium.
          </p>
        </div>

        {/* Column 3 */}
        <div className="space-y-3 border-t-2 border-mcc-gold pt-3">
          <span className="text-xs font-serif font-bold text-mcc-gold uppercase tracking-widest">
            Arts & Literature
          </span>
          <h3 className="text-lg font-serif font-bold text-gray-900 leading-snug hover:text-mcc-maroon cursor-pointer">
            <Link to="/category/deepwoods-cultural">
              College Magazine & Anthology Call for Poetry Submissions for Monsoon Issue
            </Link>
          </h3>
          <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed font-serif">
            Student poets and essayists are invited to submit original work celebrating the rich multilingual heritage of the campus.
          </p>
        </div>
      </div>

      {/* 4. BROADSHEET NEWSLETTER CALLOUT BOX */}
      <NewsletterBox className="mt-8" />
    </div>
  );
}
