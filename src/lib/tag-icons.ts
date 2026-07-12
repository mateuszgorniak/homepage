export type StackIconId =
  | 'ruby'
  | 'rails'
  | 'postgresql'
  | 'redis'
  | 'sidekiq'
  | 'typescript'
  | 'nodejs'
  | 'python'
  | 'docker'
  | 'aws'
  | 'stripe'
  | 'elasticsearch'
  | 'github-actions'
  | 'openai';

export const stackIconByTechName: Record<string, StackIconId> = {
  Ruby: 'ruby',
  Rails: 'rails',
  PostgreSQL: 'postgresql',
  Redis: 'redis',
  Sidekiq: 'sidekiq',
  TypeScript: 'typescript',
  'Node.js': 'nodejs',
  Python: 'python',
  Docker: 'docker',
  AWS: 'aws',
  Stripe: 'stripe',
  Elasticsearch: 'elasticsearch',
  'GitHub Actions': 'github-actions',
  OpenAI: 'openai',
};

export function stackIconSrc(id: StackIconId): string {
  return `stack/${id}`;
}

export function expertiseIconSrc(id: string): string {
  return `expertise/${id}`;
}
