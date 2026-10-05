export const url = 'https://en.wikipedia.org';

export default [
  { say: 'Every Wikipedia article keeps a record of everyone who changed it. Here is how to see it.', card: 'Who edited this article?' },
  {
    say: 'Search for the article you care about. We will look up Playwright, the browser testing tool.',
    run: async ui => { await ui.type('input[name=search]', 'Playwright (software)'); await ui.press('Enter'); },
  },
  {
    say: 'At the top of the article, open the View history tab.',
    run: ui => ui.click(ui.page.getByRole('link', { name: 'View history' })),
  },
  { say: 'The newest edit sits at the top, with the time and the name of the editor who made it.', run: ui => ui.note('#pagehistory li') },
  { say: 'That is all it takes. Any article, one tab, the full edit trail.', card: 'View history shows every edit' },
];
