import type { PagesCopy } from './types'

const LOREM_LONG =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

/** English copy for the additional pages. Same rule as the Indonesian file: no invented facts. */
export const pagesEn: PagesCopy = {
  pageMeta: {
    daftar: {
      title: 'Join INAPR · INAPR',
      description: 'Membership registration form for INAPR (Indonesian Association for Pattern Recognition).',
    },
    kegiatan: {
      title: 'Activities · INAPR',
      description: 'INAPR conferences, webinars, and activities on record, with search and type filter.',
    },
    'kegiatan-detail': {
      title: 'Activity details · INAPR',
      description: 'Full information about one INAPR activity.',
    },
    webinar: {
      title: 'Webinar archive · INAPR',
      description: 'The full archive of INAPR weekly webinars: titles, speakers, recordings, and materials.',
    },
    anggota: {
      title: 'Member directory · INAPR',
      description: 'INAPR member directory with search: names and institutions only.',
    },
    kontak: {
      title: 'Contact · INAPR',
      description: 'Address and official contact information of INAPR (Indonesian Association for Pattern Recognition).',
    },
    privasi: {
      title: 'Privacy policy · INAPR',
      description: 'INAPR draft privacy policy: data collected, purpose, storage, and your rights.',
    },
    notfound: {
      title: 'Page not found · INAPR',
      description: 'The page you are looking for does not exist on the INAPR site.',
    },
  },
  navPages: { webinar: 'Webinars', kontak: 'Contact', privasi: 'Privacy policy' },
  links: {
    kegiatanAll: 'See all activities',
    webinarAll: 'See the full webinar archive',
    anggotaAll: 'See the full directory',
  },
  form: {
    requiredLegend: 'Fields marked * are required.',
    optional: 'optional',
    errorSummary: (count) => (count === 1 ? '1 field needs fixing:' : `${count} fields need fixing:`),
    required: (label) => `${label} is required.`,
    tooShort: (label, min) => `${label} must be at least ${min} characters.`,
    tooLong: (label, max) => `${label} must be at most ${max} characters.`,
    invalidEmail: 'The email address is not valid. Example format: name@institution.ac.id.',
    invalidUrl: (label) => `${label} must be a link starting with http:// or https://.`,
    consentRequired: 'Tick the privacy policy consent to continue.',
    sending: 'Sending…',
    jsRequired: 'This form needs JavaScript. Enable JavaScript in your browser, or contact the board via the Contact page.',
    unavailable: {
      title: 'Online registration is not active yet',
      body: 'The service that receives registrations is not available or cannot be reached right now. Your data was NOT sent and was not saved. Please try again later or contact the board.',
      cta: 'Open the Contact page',
    },
    serverError: {
      title: 'Submission failed',
      body: 'The server could not process the request. Your data has not been saved. Try again in a moment; if it keeps failing, contact the board.',
    },
    rejected: (message) => `The server rejected the data: ${message}`,
    conflict: 'This data has already been registered. Contact the board if you think this is a mistake.',
    rateLimited: 'Too many attempts. Wait a moment, then try again.',
    consent: { before: 'I have read and agree to the ', link: 'privacy policy', after: '.' },
  },
  daftar: {
    eyebrow: 'Membership',
    title: { lead: 'Join ', accent: 'INAPR' },
    sub: 'Fill in this form to apply for membership. Your application will be verified by the board.',
    fields: {
      nama: { label: 'Full name', hint: 'Include titles if you want them on record.' },
      email: { label: 'Email', hint: 'Used by the board to contact you. Not shown on the site.' },
      institusi: { label: 'Institution', hint: 'University, research institute, or company.' },
      tahun: { label: 'Registration year', hint: 'The membership year you are applying for.' },
      bukti: {
        label: 'Payment proof link',
        hint: 'Paste a link to the payment proof file (e.g. on cloud storage). Files are not uploaded here.',
        placeholder: 'https://…',
      },
    },
    submit: 'Submit registration',
    success: {
      title: 'Registration received',
      body: 'Registration received, status: awaiting verification by the board.',
    },
    infoTitle: 'Fees and terms',
    infoBody: LOREM_LONG,
    fee: 'Annual fee',
  },
  kegiatanPage: {
    eyebrow: 'Activities',
    title: { lead: 'All ', accent: 'activities' },
    sub: 'INAPR conferences, webinars, and activities on record, newest first.',
    searchLabel: 'Search activities',
    searchPlaceholder: 'Topic, speaker, institution, or place',
    filterLabel: 'Activity type',
    filters: { all: 'All', conference: 'Conference', webinar: 'Webinar', kegiatan: 'Activity' },
    kinds: { conference: 'Conference', webinar: 'Webinar', kegiatan: 'Activity' },
    showing: (from, to, total) => `Showing ${from}–${to} of ${total} activities`,
    empty: 'No activities match this search or filter.',
    paginationLabel: 'Activity list pages',
    detail: 'View details',
    registrationOpen: 'Registration open',
    undated: 'Date not recorded',
  },
  kegiatanDetail: {
    back: 'All activities',
    kicker: 'Activity details',
    notFound: {
      title: 'Activity not found',
      body: 'No activity exists at this address. It may have been removed, or the link is wrong.',
      cta: 'See all activities',
    },
    labels: {
      date: 'Date',
      time: 'Time',
      speaker: 'Speaker',
      institution: 'Institution',
      location: 'Location',
      kind: 'Type',
    },
    noDescription: 'No description yet.',
    watch: 'Watch on YouTube',
    slides: 'Open materials',
    registration: {
      title: 'Participant registration',
      fields: {
        nama: { label: 'Full name' },
        email: { label: 'Email', hint: 'Not shown on the site.' },
        institusi: { label: 'Institution' },
      },
      submit: 'Register as participant',
      success: {
        title: 'Participant registration received',
        body: 'Your registration for this activity has been received.',
      },
    },
  },
  webinarPage: {
    eyebrow: 'Webinars',
    title: { lead: 'Webinar ', accent: 'archive' },
    sub: 'Every INAPR weekly webinar session on record, newest first.',
  },
  anggotaPage: {
    eyebrow: 'Members',
    title: { lead: 'Member ', accent: 'directory' },
    sub: 'Only names and institutions are shown; no contact details or other personal data.',
    institution: 'Institution',
  },
  kontak: {
    eyebrow: 'Contact',
    title: { lead: 'Contact ', accent: 'INAPR' },
    sub: 'Official contact information. Parts marked placeholder are waiting for data from the board.',
    addressTitle: 'Address',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    pending: 'Waiting for official data from the board.',
    noForm: 'This page has no message form.',
    registerNote: { before: 'To become a member, use the ', link: 'registration form', after: '.' },
  },
  privasi: {
    eyebrow: 'Privacy',
    title: { lead: 'Privacy ', accent: 'policy' },
    draftNotice: 'DRAFT, must be reviewed by the board before release',
    updated: 'Draft written on 26 November 2026.',
    sections: [
      {
        title: 'Data collected',
        body: ['This site only asks for data that you enter yourself through its forms.'],
        list: [
          'Member registration: name, email, institution, registration year, and (optionally) a payment proof link.',
          'Activity participant registration: name, email, and (optionally) institution.',
          'Only your theme and language choice are stored in your browser (localStorage). There are no advertising trackers.',
          'Form entries are not stored in the browser and not written to the console.',
        ],
      },
      {
        title: 'Purpose',
        body: [
          'Data is used to process and verify registrations, to contact registrants, and for INAPR board administration of membership or activity attendance. Data is not sold.',
        ],
      },
      {
        title: 'Storage and retention',
        body: [
          'Data is kept in a system managed by the INAPR board and is accessible only to authorised board members. Retention period and server location: to be set by the board.',
        ],
        placeholder: true,
      },
      {
        title: 'What is shown on the site',
        body: [
          'The member directory only shows the name and institution of active members. Email, payment proof links, and other data are never shown.',
        ],
      },
      {
        title: 'Your rights',
        body: ['You may request access to, correction of, or deletion of your data by contacting the board via the Contact page.'],
      },
      {
        title: 'Changes to this policy',
        body: ['This policy is still a draft and may change before release. Changes will be noted on this page.'],
      },
    ],
  },
  notFound: {
    eyebrow: '404',
    title: 'Page not found',
    body: 'The address you opened does not exist on the INAPR site, or the page has moved.',
    home: 'Back to home',
    kegiatan: 'See activities',
  },
  footerPages: {
    privacy: 'Privacy policy',
    contactPage: 'Contact page',
    registerLink: 'Join INAPR',
  },
}
