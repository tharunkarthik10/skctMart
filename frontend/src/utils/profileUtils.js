export const isProfileComplete = (profile) => {
  if (!profile) return false;
  const ADMIN_EMAILS = ['tharunkarthikav21@gmail.com', '727824tuio046@skct.edu.in', 'tharunkarthik21112006@gmail.com'];
  if (profile.is_admin || profile.role === 'Admin' || ADMIN_EMAILS.includes(profile.email)) return true;
  
  let pending = {};
  if (profile.pending_profile_updates) {
    try {
      pending = typeof profile.pending_profile_updates === 'string' 
        ? JSON.parse(profile.pending_profile_updates) 
        : profile.pending_profile_updates;
    } catch (e) {}
  }
  
  const requiredFields = ['name', 'register_no', 'department', 'year', 'classroom_no', 'mobile_number'];
  
  for (const field of requiredFields) {
    const val = profile[field] || pending[field];
    if (!val || String(val).trim() === '') {
      return false;
    }
  }
  
  return true;
};

