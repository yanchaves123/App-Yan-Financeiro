import type { Project, Transaction } from '../types';
import { fromCents, toCents } from './finance';

/** Only forecast the project balance not already represented by scheduled income. */
export function withProjectForecasts(transactions: Transaction[], projects: Project[]): Transaction[] {
  const result = transactions.filter(t => !t.isProjectForecast);
  for (const project of projects) {
    if (project.status === 'cancelled' || project.status === 'budget') continue;
    const scheduled = result.filter(t => t.projectId === project.id && t.type === 'income' && t.status !== 'completed')
      .reduce((sum, t) => sum + toCents(t.amount), 0);
    const remainder = toCents(project.pendingValue) - scheduled;
    if (remainder <= 0) continue;
    result.push({ id: `forecast_project_${project.id}`, userId: project.userId, type: 'income',
      description: `Saldo do projeto: ${project.name}`, amount: fromCents(remainder),
      date: project.paymentDeadline, categoryId: '', paymentMethod: project.paymentMethod || 'pix',
      projectId: project.id, clientId: project.clientId, status: 'pending',
      isProjectForecast: true, createdAt: project.createdAt });
  }
  return result;
}
