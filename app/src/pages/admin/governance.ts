import { GovernanceConfig } from '../../types'

export const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfig = {
  enterprise_name: 'Enterprise',
  enterprise_code: null,
  enterprise_description: null,
  planning_cycles: ['Annual Planning', 'Strategic Review', 'Quarterly Business Review', 'Monthly Operations Review'],
  strategy_authority_rules: [
    'None = strategy created centrally only',
    'Constrained = strategy must stay within defined guardrails',
    'Shared = strategy requires joint approval',
    'Autonomous = strategy may be created locally',
  ],
  alignment_scoring_rules: [
    'Score contract coverage against strategic objectives',
    'Highlight missing reporting obligations',
    'Detect conflicting contracts and authorities',
  ],
  required_strategy_artifacts: ['North Star', 'Objectives', 'Initiatives', 'Outcomes'],
  strategy_review_cadence: 'Quarterly Business Review',
  contract_templates: ['Directive', 'Alignment', 'Collaborative', 'Observational'],
  planning_windows: ['Annual Planning', 'Quarterly Review'],
  governance_policies: [
    'Approval required for strategic contract activation',
    'Archived organizations remain queryable for history',
  ],
  escalation_workflows: ['Business Unit Leader -> Strategy Administrator -> Global Administrator'],
}

export const toTextareaValue = (items: string[]) => items.join('\n')

export const fromTextareaValue = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
