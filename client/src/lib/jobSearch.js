// Builds search URLs for job boards. Internshala formats were checked against the live site:
//   /internships/keywords-react/                     keyword search, anywhere in India
//   /internships/work-from-home-internships/keywords-react/
//   /internships/react-internship-in-delhi/          category + city
//   /jobs/keywords-react/, /jobs/react-jobs/work-from-home/, /jobs/react-jobs-in-delhi/

const slug = (s) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function internshalaUrl({ keyword, location, type, remote }) {
  const kw = slug(keyword);
  const city = slug(location);
  const base = 'https://internshala.com';

  if (type === 'internship') {
    if (remote) return `${base}/internships/work-from-home-internships/${kw ? `keywords-${kw}/` : ''}`;
    if (city) return `${base}/internships/${kw ? `${kw}-` : ''}internship-in-${city}/`;
    return `${base}/internships/${kw ? `keywords-${kw}/` : ''}`;
  }

  if (remote) return `${base}/jobs/${kw ? `${kw}-jobs/` : ''}work-from-home/`;
  if (city) return `${base}/jobs/${kw ? `${kw}-` : ''}jobs-in-${city}/`;
  return `${base}/jobs/${kw ? `keywords-${kw}/` : ''}`;
}

export function linkedinUrl({ keyword, location, type, remote, recent }) {
  const params = new URLSearchParams();
  if (keyword.trim()) params.set('keywords', keyword.trim());
  params.set('location', location.trim() || 'India');
  // f_JT: I = internship, F = full-time · f_E: 1 = internship, 2 = entry level
  params.set('f_JT', type === 'internship' ? 'I' : 'F');
  params.set('f_E', type === 'internship' ? '1' : '2');
  if (remote) params.set('f_WT', '2');
  if (recent) params.set('f_TPR', 'r604800'); // posted in the past week
  return `https://www.linkedin.com/jobs/search/?${params}`;
}
