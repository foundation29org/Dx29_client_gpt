export interface SeoRouteConfig {
  seoTitle: string;
  seoDescription: string;
  canonicalPath?: string;
  robots?: string;
}

export const DEFAULT_SEO: SeoRouteConfig = {
  seoTitle: 'DxGPT: Free AI Diagnostic Support for Complex & Rare Diseases',
  seoDescription: 'Free AI diagnostic support by Foundation29. Structure symptoms and clinical histories into possible differential diagnosis hypotheses for professional review. GDPR compliant.',
  canonicalPath: '/'
};

export const SEO_ROUTES: Record<string, SeoRouteConfig> = {
  '/': DEFAULT_SEO,
  '/beta': {
    seoTitle: 'DxGPT Beta: Experimental Medical AI Features',
    seoDescription: 'Test experimental DxGPT features for working with clinical descriptions, medical questions, reports, and images.',
    canonicalPath: '/beta'
  },
  '/aboutus': {
    seoTitle: 'How DxGPT Supports Differential Diagnosis',
    seoDescription: 'Learn how Foundation29 developed DxGPT to structure clinical descriptions into prioritized diagnostic hypotheses while supporting professional judgment.',
    canonicalPath: '/aboutus'
  },
  '/collaboration': {
    seoTitle: 'Collaborate with DxGPT | Healthcare Partnerships',
    seoDescription: 'Explore collaborations, sponsorships, and healthcare implementations that help Foundation29 improve equitable access to diagnostic support.',
    canonicalPath: '/collaboration'
  },
  '/integration': {
    seoTitle: 'Integrate DxGPT into Healthcare Workflows',
    seoDescription: 'Explore API and deployment options for integrating DxGPT diagnostic support into healthcare systems and clinical workflows.',
    canonicalPath: '/integration'
  },
  '/foundation29': {
    seoTitle: 'Foundation29 | The Nonprofit behind DxGPT',
    seoDescription: 'Meet Foundation29, the nonprofit organization developing DxGPT to improve access to diagnostic support for common, complex, and rare diseases.',
    canonicalPath: '/foundation29'
  },
  '/faq': {
    seoTitle: 'DxGPT Frequently Asked Questions',
    seoDescription: 'Find answers about how DxGPT works, who can use it, privacy, supported languages, safety limitations, and its role in diagnostic support.',
    canonicalPath: '/faq'
  },
  '/reports': {
    seoTitle: 'DxGPT Usage Statistics and Reports',
    seoDescription: 'Review public DxGPT usage statistics, including diagnostic support activity and user reach.',
    canonicalPath: '/reports'
  },
  '/feedback': {
    seoTitle: 'Share Feedback about DxGPT',
    seoDescription: 'Share your experience and suggestions to help Foundation29 improve DxGPT.',
    canonicalPath: '/feedback',
    robots: 'noindex, nofollow'
  },
  '/privacy-policy': {
    seoTitle: 'DxGPT Privacy Policy',
    seoDescription: 'Read how Foundation29 protects personal and health information when you use DxGPT.',
    canonicalPath: '/privacy-policy'
  },
  '/cookies': {
    seoTitle: 'DxGPT Cookie Policy',
    seoDescription: 'Read how DxGPT uses cookies and how you can manage your cookie preferences.',
    canonicalPath: '/cookies'
  }
};

export const RESULT_SEO: SeoRouteConfig = {
  seoTitle: 'Shared DxGPT Result',
  seoDescription: 'A privately shared DxGPT result.',
  robots: 'noindex, nofollow'
};

export function getSeoForUrl(url: string): SeoRouteConfig {
  let rawPath = url || '/';
  if (/^https?:\/\//i.test(rawPath)) {
    rawPath = new URL(rawPath).pathname;
  }

  const path = rawPath.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';

  if (path.startsWith('/result/')) {
    return RESULT_SEO;
  }

  return SEO_ROUTES[path === '/.' ? '/' : path] || DEFAULT_SEO;
}
