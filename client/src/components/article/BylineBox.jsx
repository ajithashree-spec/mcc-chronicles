import React from 'react';
import { User, Camera, Feather, BookOpen, ShieldCheck, Building } from 'lucide-react';

/**
 * Returns role-appropriate icon and badge color.
 */
function getRoleBadge(role = 'Co-Author') {
  const normalized = role.toLowerCase();
  if (normalized.includes('photo')) {
    return {
      icon: Camera,
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
      label: role,
    };
  }
  if (normalized.includes('lead') || normalized.includes('reporter')) {
    return {
      icon: Feather,
      badgeClass: 'bg-mcc-maroon/10 text-mcc-maroon border-mcc-maroon/20',
      label: role,
    };
  }
  if (normalized.includes('archiv')) {
    return {
      icon: BookOpen,
      badgeClass: 'bg-mcc-navy/10 text-mcc-navy border-mcc-navy/20',
      label: role,
    };
  }
  return {
    icon: Feather,
    badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
    label: role,
  };
}

/**
 * BylineBox: Broadsheet Multi-Author & Co-Contributor Byline Attribution (Task 99)
 * Renders multi-author avatars, names, roles, and bios with broadsheet flair.
 */
export default function BylineBox({
  authors = [],
  defaultAuthor = null,
  departmentName = null,
  compact = false,
}) {
  // Normalize authors array
  let authorList = Array.isArray(authors) && authors.length > 0 ? authors : [];

  if (authorList.length === 0 && defaultAuthor) {
    authorList = [
      {
        user_id: defaultAuthor.id || 1,
        name: defaultAuthor.name || 'MCC Editorial Staff',
        role_in_article: 'Lead Reporter',
        bio: defaultAuthor.bio,
        avatar_url: defaultAuthor.avatar_url,
      },
    ];
  }

  // Format combined byline string (e.g., "Reporting by Sharon Kumar • Photography by Samuel Miller")
  const bylineCreditsString = authorList
    .map((auth) => {
      const rolePrefix =
        auth.role_in_article === 'Lead Reporter'
          ? 'Reporting by'
          : auth.role_in_article === 'Staff Photographer'
          ? 'Photography by'
          : auth.role_in_article === 'Archivist'
          ? 'Archival Research by'
          : `${auth.role_in_article || 'Dispatch by'}`;
      return `${rolePrefix} ${auth.name || 'Staff'}`;
    })
    .join(' • ');

  // Compact inline mode (suitable for top of article)
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs font-serif text-mcc-navy">
        <span className="font-bold text-mcc-maroon uppercase tracking-wider text-[11px]">Byline:</span>
        <span className="italic">{bylineCreditsString}</span>
      </div>
    );
  }

  // Full Broadsheet Box (for bottom of article)
  return (
    <div className="no-print mt-12 bg-white rounded-md border border-mcc-maroon/20 shadow-xs overflow-hidden font-serif">
      {/* Broadsheet Header Header Strip */}
      <div className="px-6 py-3 bg-mcc-paper border-b border-mcc-maroon/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Feather className="w-4 h-4 text-mcc-maroon" />
          <h4 className="text-xs uppercase tracking-widest font-black text-mcc-maroon">
            Editorial Byline & Dispatch Contributors
          </h4>
        </div>
        <p className="text-[11px] text-gray-600 italic">
          {bylineCreditsString}
        </p>
      </div>

      {/* Contributors Grid / Roster */}
      <div className={`p-6 grid gap-6 ${authorList.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {authorList.map((author, index) => {
          const { icon: RoleIcon, badgeClass, label: roleLabel } = getRoleBadge(
            author.role_in_article
          );
          const name = author.name || 'Staff Correspondent';
          const initial = name[0]?.toUpperCase() || 'M';
          const bio =
            author.bio ||
            `Collegiate correspondent and contributor to The Madras Christian College Chronicles. Documenting campus developments, academic research, and collegiate life.`;

          return (
            <div
              key={author.id || author.user_id || index}
              className="flex items-start gap-4 p-4 rounded-md bg-gray-50/50 border border-gray-200/80 hover:border-mcc-maroon/30 hover:bg-white transition-all shadow-2xs"
            >
              {/* Avatar / Initial */}
              {author.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt={name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-mcc-gold/60 shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-mcc-navy text-mcc-gold font-bold flex items-center justify-center text-lg shrink-0 shadow-xs border-2 border-mcc-gold/40">
                  {initial}
                </div>
              )}

              {/* Author Details */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <h5 className="font-bold text-mcc-navy text-sm sm:text-base leading-tight truncate">
                    {name}
                  </h5>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${badgeClass}`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    <span>{roleLabel}</span>
                  </span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed font-serif line-clamp-3">
                  {bio}
                </p>

                {departmentName && (
                  <p className="text-[11px] font-sans text-gray-500 flex items-center gap-1 pt-1">
                    <Building className="w-3 h-3 text-mcc-gold" />
                    <span className="truncate">Department of {departmentName} • MCC</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
