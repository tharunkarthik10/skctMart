import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

export const AdminEvents = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Suggest Edit modal state
  const [suggestModalItem, setSuggestModalItem] = useState(null);
  const [suggestionText, setSuggestionText] = useState('');

  // Full View modal state
  const [viewModalItem, setViewModalItem] = useState(null);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/events/proposals');
      setProposals(res.data);
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleApprove = async (proposal) => {
    const confirmed = window.confirm(`Approve and publish "${proposal.title}" into the ${proposal.category.toUpperCase()} section?`);
    if (!confirmed) return;

    try {
      await apiClient.put(`/events/proposals/${proposal.id}/status`, {
        status: 'APPROVED',
        adminNotes: proposal.adminNotes || 'Approved by MakerMart Admin.'
      });
      setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, status: 'APPROVED' } : p));
      if (viewModalItem?.id === proposal.id) {
        setViewModalItem(prev => ({ ...prev, status: 'APPROVED' }));
      }
      alert(`✅ "${proposal.title}" has been approved and is now LIVE in the ${proposal.category} section!`);
    } catch (err) {
      alert('Failed to approve event: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRemove = async (proposal) => {
    const reason = prompt(`Enter reason for removing "${proposal.title}":`, "Removed by administrator.");
    if (reason === null) return; // User cancelled

    try {
      await apiClient.put(`/events/proposals/${proposal.id}/status`, {
        status: 'REJECTED',
        adminNotes: reason || 'Removed by Admin.'
      });
      setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, status: 'REJECTED', adminNotes: reason || 'Removed by Admin.' } : p));
      if (viewModalItem?.id === proposal.id) {
        setViewModalItem(prev => ({ ...prev, status: 'REJECTED', adminNotes: reason || 'Removed by Admin.' }));
      }
      alert(`❌ Event "${proposal.title}" has been marked as REMOVED.`);
    } catch (err) {
      alert('Failed to remove event: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleBlockUser = async (proposal) => {
    const email = proposal.contactEmail;
    const name = proposal.contactName || proposal.organizer || 'this organizer';
    if (!email) {
      alert("No contact email found for this organizer to block.");
      return;
    }

    const confirmed = window.confirm(
      `⚠️ BLOCK USER CONFIRMATION\n\nAre you sure you want to BLOCK ${name} (${email})?\n\nThey will be immediately barred from:\n• Accessing the website and products\n• Posting or submitting campus events\n\nThis event proposal will also be marked as removed.`
    );
    if (!confirmed) return;

    try {
      await apiClient.post('/users/block-by-email', { email, block: true });

      await apiClient.put(`/events/proposals/${proposal.id}/status`, {
        status: 'REJECTED',
        adminNotes: `Organizer blocked by Admin (${email}).`
      });

      setProposals(prev => prev.map(p => p.id === proposal.id ? {
        ...p,
        status: 'REJECTED',
        adminNotes: `Organizer blocked by Admin (${email}).`
      } : p));

      if (viewModalItem?.id === proposal.id) {
        setViewModalItem(prev => ({
          ...prev,
          status: 'REJECTED',
          adminNotes: `Organizer blocked by Admin (${email}).`
        }));
      }

      alert(`🚫 ${name} (${email}) has been BLOCKED.\nThey are now locked out from logging in, viewing products, and posting events.`);
    } catch (err) {
      alert("Failed to block user: " + (err.response?.data?.error || err.message));
    }
  };

  const handleOpenSuggest = (proposal) => {
    setSuggestModalItem(proposal);
    setSuggestionText(proposal.adminNotes || '');
  };

  const handleSubmitSuggestion = async (e) => {
    e.preventDefault();
    if (!suggestionText.trim()) {
      alert("Please enter your suggested edits or feedback.");
      return;
    }

    try {
      await apiClient.put(`/events/proposals/${suggestModalItem.id}/status`, {
        status: 'EDIT_SUGGESTED',
        adminNotes: suggestionText
      });
      setProposals(prev => prev.map(p => p.id === suggestModalItem.id ? { ...p, status: 'EDIT_SUGGESTED', adminNotes: suggestionText } : p));
      if (viewModalItem?.id === suggestModalItem.id) {
        setViewModalItem(prev => ({ ...prev, status: 'EDIT_SUGGESTED', adminNotes: suggestionText }));
      }
      setSuggestModalItem(null);
      alert("📝 Edit suggestion recorded and sent to organizer!");
    } catch (err) {
      alert('Failed to save suggestion: ' + (err.response?.data?.error || err.message));
    }
  };

  // Filtered queries
  const filtered = proposals.filter(p => {
    const matchesTab = activeTab === 'ALL' ? true : p.status === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ? true : (
      (p.title || '').toLowerCase().includes(q) ||
      (p.organizer || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q) ||
      (p.college || '').toLowerCase().includes(q) ||
      (p.department || '').toLowerCase().includes(q)
    );
    return matchesTab && matchesSearch;
  });

  const pendingCount = proposals.filter(p => p.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <span>📢</span> Event Queries & Approval Queue
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Review event proposals submitted by student clubs, edit details, or permit publishing live
          </p>
        </div>

        <div className="relative w-full sm:w-64 flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-[var(--color-text-secondary)] text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search queries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)] shadow-sm"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[var(--color-border)]">
        {[
          { key: 'ALL', label: 'All Queries', count: proposals.length },
          { key: 'PENDING', label: '⏳ Pending Review', count: pendingCount, highlight: pendingCount > 0 },
          { key: 'APPROVED', label: '✅ Approved & Live', count: proposals.filter(p => p.status === 'APPROVED').length },
          { key: 'EDIT_SUGGESTED', label: '📝 Edit Suggested', count: proposals.filter(p => p.status === 'EDIT_SUGGESTED').length },
          { key: 'REJECTED', label: '❌ Rejected', count: proposals.filter(p => p.status === 'REJECTED').length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              tab.highlight ? 'bg-amber-400 text-zinc-950 font-black' : 'bg-black/10 dark:bg-white/10'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Proposal Cards List */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-standard p-12 text-center text-[var(--color-text-secondary)] border border-[var(--color-border)]">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">inbox</span>
          <p className="font-bold">No event proposals found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filtered.map((item) => {
            const isApproved = item.status === 'APPROVED';
            const isPending = item.status === 'PENDING';
            const isEditSuggested = item.status === 'EDIT_SUGGESTED';
            const isRejected = item.status === 'REJECTED';

            return (
              <div 
                key={item.id}
                className={`card-standard p-5 sm:p-6 rounded-2xl border transition-all ${
                  isPending 
                    ? 'border-amber-500/40 bg-amber-500/5' 
                    : isApproved 
                      ? 'border-emerald-500/30' 
                      : 'border-[var(--color-border)]'
                }`}
              >
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Poster Thumbnail */}
                  <div className="w-full md:w-48 h-36 shrink-0 rounded-xl overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)] relative group">
                    {item.posterUrl ? (
                      <img 
                        src={item.posterUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
                        <span className="material-symbols-outlined text-3xl opacity-40">image_not_supported</span>
                        <span className="text-[10px] mt-1 font-semibold">No Poster Uploaded</span>
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/80 text-white backdrop-blur-sm whitespace-nowrap inline-flex items-center">
                      {item.category}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
                    <div>
                      {/* College & Department Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2.5 py-0.5 rounded-lg font-bold">
                          <span className="material-symbols-outlined text-[13px]">account_balance</span>
                          <span>{item.college || 'Sri Krishna College of Technology (SKCT), Coimbatore'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 bg-[var(--color-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-lg font-semibold">
                          <span className="material-symbols-outlined text-[13px] text-blue-500">school</span>
                          <span>{item.department || item.organizer || 'Inter-Departmental'}</span>
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h3 className="font-bold text-base sm:text-lg text-[var(--color-text-primary)] leading-snug">
                          {item.title}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          isApproved 
                            ? 'bg-emerald-500/15 text-emerald-500' 
                            : isPending 
                              ? 'bg-amber-500/15 text-amber-500 animate-pulse' 
                              : isEditSuggested 
                                ? 'bg-blue-500/15 text-blue-500' 
                                : 'bg-red-500/15 text-red-500'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-3">
                        {item.desc}
                      </p>

                      {/* Event Venue, College & Department - Where the event takes place */}
                      <div className="p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-xs space-y-2 mb-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-border)]">
                          <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-[var(--color-primary)]">corporate_fare</span>
                            Event Venue & Hosting Campus
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-[9px] tracking-wide">
                            Where Event Takes Place
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-[var(--color-text-secondary)] flex items-center gap-1 mb-0.5">
                              <span className="material-symbols-outlined text-[12px] text-amber-500">account_balance</span>
                              College / Campus
                            </span>
                            <span className="font-bold text-[var(--color-text-primary)] text-xs block truncate" title={item.college}>
                              {item.college || "Sri Krishna College of Technology (SKCT), Coimbatore"}
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] uppercase font-bold text-[var(--color-text-secondary)] flex items-center gap-1 mb-0.5">
                              <span className="material-symbols-outlined text-[12px] text-blue-500">school</span>
                              Hosting Department
                            </span>
                            <span className="font-bold text-[var(--color-text-primary)] text-xs block truncate" title={item.department}>
                              {item.department || "Dept. of Computer Science & Engineering"}
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] uppercase font-bold text-[var(--color-text-secondary)] flex items-center gap-1 mb-0.5">
                              <span className="material-symbols-outlined text-[12px] text-red-500">location_on</span>
                              Location / Venue
                            </span>
                            <span className="font-bold text-red-500 text-xs block truncate" title={item.location}>
                              {item.location || "Main Auditorium, Hall 1"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-1.5 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)]">
                          <span>📅 <strong className="text-[var(--color-text-primary)]">{item.date}</strong> {item.time ? `(${item.time})` : ''}</span>
                          <span>🏛️ Organizer: <strong className="text-[var(--color-text-primary)]">{item.organizer}</strong></span>
                        </div>
                      </div>

                      {/* Contact & Links */}
                      <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-[var(--color-text-secondary)]">
                        {item.contactName && <span>Lead: <strong className="text-[var(--color-text-primary)]">{item.contactName}</strong></span>}
                        {item.contactEmail && <span>📧 {item.contactEmail}</span>}
                        {item.link && (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[var(--color-primary)] font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open Registration Link</span>
                            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          </a>
                        )}
                        {item.prize && <span className="text-amber-500 font-bold">🏆 {item.prize}</span>}
                        {item.perk && <span className="text-purple-400 font-bold">🎁 {item.perk}</span>}
                      </div>

                      {/* Admin Notes / Suggestion Callout */}
                      {item.adminNotes && (
                        <div className="mt-2.5 p-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs flex items-start gap-2">
                          <span className="material-symbols-outlined text-sm text-blue-400 mt-0.5">comment</span>
                          <div>
                            <span className="font-bold text-[10px] uppercase text-[var(--color-text-secondary)]">Admin Note / Feedback:</span>
                            <p className="text-xs text-[var(--color-text-primary)] italic">{item.adminNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--color-border)]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--color-text-secondary)] font-mono">
                          Ref: {item.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Full View */}
                        <button
                          onClick={() => setViewModalItem(item)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-text-primary)] hover:text-[var(--color-primary)] flex items-center gap-1.5 transition-colors shadow-sm"
                          title="Completely view all details of this listed event"
                        >
                          <span className="material-symbols-outlined text-[15px] text-[var(--color-primary)]">visibility</span>
                          Full View
                        </button>

                        {/* Suggest an edit */}
                        <button
                          onClick={() => handleOpenSuggest(item)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-blue-500/40 text-blue-500 hover:bg-blue-500/10 flex items-center gap-1.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit_note</span>
                          Suggest Edit
                        </button>

                        {/* Remove */}
                        {!isRejected && (
                          <button
                            onClick={() => handleRemove(item)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 flex items-center gap-1.5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">close</span>
                            Remove
                          </button>
                        )}

                        {/* Approve */}
                        {!isApproved && (
                          <button
                            onClick={() => handleApprove(item)}
                            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            Approve
                          </button>
                        )}

                        {/* Block User */}
                        <button
                          onClick={() => handleBlockUser(item)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-500/30 text-red-600 hover:bg-red-600 hover:text-white flex items-center gap-1.5 transition-colors"
                          title="Block organizer from posting events and accessing website"
                        >
                          <span className="material-symbols-outlined text-[15px]">block</span>
                          Block User
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggest Edit Modal */}
      {suggestModalItem && (
        <div className="fixed inset-0 z-[130] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-standard w-full max-w-md p-6 relative rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h3 className="font-bold text-base text-[var(--color-text-primary)] flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">edit_note</span>
                Suggest Edits to Organizer
              </h3>
              <button 
                onClick={() => setSuggestModalItem(null)}
                className="text-[var(--color-text-secondary)] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)]">
              Enter feedback or corrections for <strong>"{suggestModalItem.title}"</strong> (e.g., requested poster changes, auditorium availability, or date adjustments):
            </p>

            <form onSubmit={handleSubmitSuggestion} className="space-y-3">
              <textarea
                required
                rows={4}
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="e.g. Please upload a 1920x1080 resolution poster and confirm permission letter from the department HOD."
                className="w-full p-3 text-xs bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
              ></textarea>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSuggestModalItem(null)}
                  className="btn-secondary py-2 px-4 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1 shadow-md !bg-blue-600 hover:!bg-blue-500"
                >
                  Save Suggestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full View Modal - Completely view the listed event */}
      {viewModalItem && (
        <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="card-standard w-full max-w-3xl max-h-[92vh] flex flex-col p-5 sm:p-7 relative rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl my-auto overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--color-primary)]/15 text-[var(--color-primary)] whitespace-nowrap inline-flex items-center">
                    {viewModalItem.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    viewModalItem.status === 'APPROVED' 
                      ? 'bg-emerald-500/15 text-emerald-500' 
                      : viewModalItem.status === 'PENDING' 
                        ? 'bg-amber-500/15 text-amber-500' 
                        : viewModalItem.status === 'EDIT_SUGGESTED' 
                          ? 'bg-blue-500/15 text-blue-500' 
                          : 'bg-red-500/15 text-red-500'
                  }`}>
                    {viewModalItem.status?.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                    ID: {viewModalItem.id}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] leading-tight">
                  {viewModalItem.title}
                </h2>
              </div>
              <button
                onClick={() => setViewModalItem(null)}
                className="w-9 h-9 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-5 space-y-5 text-xs sm:text-sm pr-1">
              {/* Poster Image preview if available */}
              {viewModalItem.posterUrl && (
                <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] max-h-72 bg-black/40 flex items-center justify-center">
                  <img
                    src={viewModalItem.posterUrl}
                    alt={viewModalItem.title}
                    className="w-full h-full object-cover max-h-72"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Institution & Location Section */}
              <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-3">
                <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[17px]">corporate_fare</span>
                  <span>Campus, Department & Venue</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] block mb-0.5">College / Institution</span>
                    <span className="font-bold text-[var(--color-text-primary)]">{viewModalItem.college || 'Sri Krishna College of Technology (SKCT), Coimbatore'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] block mb-0.5">Department</span>
                    <span className="font-bold text-[var(--color-text-primary)]">{viewModalItem.department || viewModalItem.organizer || 'Inter-Departmental'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <span className="text-[10px] uppercase font-bold text-red-500 block mb-0.5">Location / Venue</span>
                    <span className="font-bold text-red-500">{viewModalItem.location || 'Main Auditorium'}</span>
                  </div>
                </div>
              </div>

              {/* Date, Timing & Capacity */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] block mb-0.5">Date</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{viewModalItem.date || 'TBA'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] block mb-0.5">Time</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{viewModalItem.time || 'All Day'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] block mb-0.5">Prize / Perks</span>
                  <span className="font-bold text-amber-500">{viewModalItem.prize || viewModalItem.perk || 'Free Entry / Certificates'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] block mb-0.5">Stalls / Capacity</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{viewModalItem.stallsTotal || 'Open Capacity'}</span>
                </div>
              </div>

              {/* Complete Description */}
              <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider block">Full Event Description</span>
                <p className="text-xs sm:text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">
                  {viewModalItem.desc || 'No description provided.'}
                </p>
              </div>

              {/* Organizer & Contact Info */}
              <div className="p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] space-y-3">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider block">Organizer & Registration Info</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-[var(--color-text-secondary)] block">Organizing Body</span>
                    <span className="font-bold text-[var(--color-text-primary)]">{viewModalItem.organizer || 'Student Club'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--color-text-secondary)] block">Student / Faculty Lead</span>
                    <span className="font-bold text-[var(--color-text-primary)]">{viewModalItem.contactName || 'Organizer'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--color-text-secondary)] block">Contact Email</span>
                    <span className="font-bold text-[var(--color-text-primary)] font-mono text-xs">{viewModalItem.contactEmail || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--color-border)]">
                  <div>
                    <span className="text-[10px] text-[var(--color-text-secondary)] block">Contact Phone</span>
                    <span className="font-bold text-[var(--color-text-primary)]">{viewModalItem.contactPhone || 'N/A'}</span>
                  </div>
                  {viewModalItem.link && (
                    <a
                      href={viewModalItem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <span>Open Registration Portal</span>
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Admin Notes / Feedback */}
              {viewModalItem.adminNotes && (
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-xs space-y-1">
                  <span className="font-bold uppercase text-[10px] text-blue-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">comment</span>
                    Admin Feedback / Log
                  </span>
                  <p className="text-xs text-[var(--color-text-primary)] italic">{viewModalItem.adminNotes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons in Modal Footer */}
            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleBlockUser(viewModalItem)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">block</span>
                Block User
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const item = viewModalItem;
                    setViewModalItem(null);
                    handleOpenSuggest(item);
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-blue-500/40 text-blue-500 hover:bg-blue-500/10 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  Suggest Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleRemove(viewModalItem)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  Remove
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(viewModalItem)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
