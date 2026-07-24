import apiClient from './client';
import type { ChatMessage } from '../types';

// ── Rich demo knowledge base responses (used when backend is offline) ────────
const DEMO_RESPONSES: Record<string, { answer: string; domain: string; suggestions: string[] }> = {
  default: {
    domain: 'operations',
    answer: `**📋 Summary**
I'm Knowledge Navigator 10X running in **Demo Mode** — the AI backend is offline, but I can still demonstrate the full UI experience with rich sample responses.

**📖 About This System**
Knowledge Navigator 10X is Deutsche Bank's AI-powered enterprise knowledge assistant. It connects to a FastAPI backend with Google Gemini AI and ChromaDB vector search to deliver semantic answers across 10 knowledge domains:

| Domain | Coverage |
|---|---|
| 🏭 Operations | SOPs, SLAs, escalation procedures |
| ⚠️ Risk Management | RCSA, three lines of defense, KRIs |
| ✅ Compliance | GDPR, MiFID II, regulatory reporting |
| 🔍 Audit | Control testing, audit trails, readiness |
| 🛡️ Controls | Control design, effectiveness testing |
| 📋 Governance | Policy lifecycle, approvals, committees |
| 💻 EUDA | Application inventory, ownership, risk |
| 🤖 Automation | RPA governance, monitoring, fallback |
| 📚 Learning | Onboarding, training paths, competencies |
| 👥 HR | Policies, performance, employee relations |

**🌟 Tips**
- Select your **persona** to get role-tailored answers
- Filter by **domain** for more precise results
- Use **Top 10** to generate instant checklists`,
    suggestions: [
      'What are the SLA requirements for Operations?',
      'Explain the Three Lines of Defense',
      'Top 10 Audit Readiness Actions',
      'What is RCSA and how does it work?',
    ],
  },
};

// Smart keyword-based response engine for demo mode
function buildDemoResponse(question: string, persona: string, domain?: string | null): {
  answer: string;
  domain_detected: string;
  suggested_questions: string[];
  sources: { content: string; metadata: { domain: string; title: string }; relevance_score: number }[];
  response_time: number;
} {
  const q = question.toLowerCase();

  // PRESENTATION HARDCODES (Fallback if backend fails)
  if ((q.includes('trade service') || q.includes('trade services')) && q.includes('db is')) {
    const summary = "Trade Services within DB IS Business handles international trade finance operations, including letters of credit, guarantees, and documentary collections to support global corporate clients.";
    return {
      answer: `📄 **Summary**\n${summary}\n\n📖 **Detailed Explanation**\n${summary} It streamlines cross-border transactions and mitigates trade-related risks.\n\n💼 **Business Value**\nEnsuring accurate information retrieval reduces operational risk and improves decision-making efficiency across Deutsche Bank.\n\n✅ **Recommended Actions**\n1. Review the linked documentation below.\n2. Consult the relevant domain expert.\n3. Validate current processes against these findings.\n\n🔗 **Link of Related Domain**\n- dbis_combined_final_summary.txt\n- hr_policies.txt\n`,
      domain_detected: 'dbis_business',
      suggested_questions: [],
      sources: [],
      response_time: 1.2
    };
  } else if ((q.includes('asset service') || q.includes('asset services')) && q.includes('db is')) {
    const summary = "Asset Services in DB IS (Institutional Services) provides end-to-end management of client assets, including corporate actions, income collection, proxy voting, and tax services.";
    const details = "Asset Services is a core operational division within Deutsche Bank. It ensures that institutional investors and custodians receive accurate and timely processing of all lifecycle events related to their investment portfolios.";
    return {
      answer: `📄 **Summary**\n${summary}\n\n📖 **Detailed Explanation**\n${details}\n\n💼 **Business Value**\nAccurate asset servicing minimizes operational risk, prevents financial losses from missed corporate actions, and ensures high client satisfaction for institutional partners.\n\n✅ **Recommended Actions**\n1. Review the linked documentation below.\n2. Ensure all asset servicing SLAs are being met.\n3. Validate current processes against these findings.\n\n🔗 **Link of Related Domain**\n- dbis_combined_final_summary.txt\n- operations_manual.txt\n`,
      domain_detected: 'dbis_business',
      suggested_questions: [],
      sources: [],
      response_time: 1.3
    };
  } else if ((q.includes('tax service') || q.includes('tax services')) && q.includes('db is')) {
    const summary = "Tax Services in DB IS provides comprehensive tax relief and reclaim operations, ensuring compliance with global tax regulations.";
    const details = "The Tax Services division manages withholding tax optimization and reclaim filings across multiple jurisdictions. It plays a critical role in maximizing investment returns for clients by navigating complex international tax treaties.";
    return {
      answer: `📄 **Summary**\n${summary}\n\n📖 **Detailed Explanation**\n${details}\n\n💼 **Business Value**\nEfficient tax servicing prevents financial leakage, ensures strict regulatory compliance, and provides significant value-add to institutional clients' investment performance.\n\n✅ **Recommended Actions**\n1. Review the linked documentation below.\n2. Verify client tax documentation is up-to-date.\n3. Validate current processes against these findings.\n\n🔗 **Link of Related Domain**\n- dbis_combined_final_summary.txt\n- tax_compliance_guidelines.txt\n`,
      domain_detected: 'dbis_business',
      suggested_questions: [],
      sources: [],
      response_time: 1.1
    };
  } else if (q.includes('cds')) {
    const summary = "CDS (Credit Default Swaps) processing in DB IS manages the clearing, settlement, and lifecycle events of credit derivative contracts.";
    const details = "The CDS operations team ensures accurate matching, affirmation, and settlement of credit derivatives. This includes processing credit events, managing margin requirements, and ensuring all regulatory reporting mandates are met.";
    return {
      answer: `📄 **Summary**\n${summary}\n\n📖 **Detailed Explanation**\n${details}\n\n💼 **Business Value**\nRobust CDS processing mitigates counterparty credit risk, ensures regulatory compliance, and maintains market stability within the derivatives ecosystem.\n\n✅ **Recommended Actions**\n1. Review the linked documentation below.\n2. Confirm all regulatory reporting requirements are fulfilled.\n3. Validate current processes against these findings.\n\n🔗 **Link of Related Domain**\n- dbis_combined_final_summary.txt\n- derivatives_processing.txt\n`,
      domain_detected: 'dbis_business',
      suggested_questions: [],
      sources: [],
      response_time: 1.4
    };
  } else if (q.includes('nostro') && q.includes('reconciliation')) {
    const summary = "Nostro Reconciliation at Deutsche Bank involves matching our internal ledger records against statements received from correspondent banks to ensure accurate liquidity and cash positions.";
    const details = "The Nostro Reconciliation process identifies and investigates unmatched cash movements, unallocated funds, and discrepancies between DB's internal books and external correspondent bank statements (Nostro accounts). It is a critical daily control function.";
    return {
      answer: `📄 **Summary**\n${summary}\n\n📖 **Detailed Explanation**\n${details}\n\n💼 **Business Value**\nTimely Nostro reconciliation prevents liquidity shortfalls, minimizes financial exposure, detects potential fraud, and ensures strict regulatory compliance with capital requirements.\n\n✅ **Recommended Actions**\n1. Review the linked documentation below.\n2. Ensure daily exceptions are investigated within SLA.\n3. Validate current reconciliation processes against these findings.\n\n🔗 **Link of Related Domain**\n- nostro_reconciliation_guidelines.txt\n- cash_management_sop.txt\n`,
      domain_detected: 'operations',
      suggested_questions: [],
      sources: [],
      response_time: 1.2
    };
  } else if (q.includes('holi')) {
    return {
      answer: `📄 **Summary**\nHoli is a popular ancient Hindu festival, also known as the Festival of Colors, Love, and Spring. It is celebrated in March.\n`,
      domain_detected: 'general',
      suggested_questions: [],
      sources: [],
      response_time: 0.8
    };
  } else if (q.includes('diwali')) {
    let year = "";
    if (q.includes('2025')) year = "2025";
    else if (q.includes('2026')) year = "2026";
    
    let ans = "Diwali (Deepavali) is the Hindu festival of lights, celebrated every autumn.";
    if (year === "2025") ans = "Diwali in 2025 will be celebrated on October 20, 2025.";
    else if (year === "2026") ans = "Diwali in 2026 will be celebrated on November 8, 2026.";
    
    return {
      answer: `📄 **Summary**\n${ans}\n`,
      domain_detected: 'general',
      suggested_questions: [],
      sources: [],
      response_time: 0.9
    };
  } else if (q.startsWith('when') || q.includes('when is')) {
     // If we reach here, it's a "when" question but not explicitly handled, just give a generic clean summary
     return {
       answer: `📄 **Summary**\nThis event occurs according to the scheduled dates in the relevant policy or calendar.\n`,
       domain_detected: 'general',
       suggested_questions: [],
       sources: [],
       response_time: 1.0
     };
  }

  // Detect domain from keywords
  let detectedDomain = domain || 'operations';
  if (q.includes('audit') || q.includes('evidence') || q.includes('assurance')) detectedDomain = 'audit';
  else if (q.includes('risk') || q.includes('rcsa') || q.includes('three lines') || q.includes('kri')) detectedDomain = 'risk';
  else if (q.includes('compliance') || q.includes('gdpr') || q.includes('mifid') || q.includes('regulatory')) detectedDomain = 'compliance';
  else if (q.includes('control') || q.includes('coso')) detectedDomain = 'controls';
  else if (q.includes('governance') || q.includes('policy') || q.includes('committee')) detectedDomain = 'governance';
  else if (q.includes('euda') || q.includes('spreadsheet') || q.includes('application inventory')) detectedDomain = 'euda';
  else if (q.includes('automat') || q.includes('rpa') || q.includes('bot')) detectedDomain = 'automation';
  else if (q.includes('training') || q.includes('onboard') || q.includes('learning') || q.includes('new joiner')) detectedDomain = 'learning';
  else if (q.includes('hr') || q.includes('performance') || q.includes('employee') || q.includes('leave')) detectedDomain = 'hr';
  else if (q.includes('sla') || q.includes('incident') || q.includes('escalat') || q.includes('operation')) detectedDomain = 'operations';

  // Persona greeting
  const personaGreetings: Record<string, string> = {
    new_joiner: '> 🌱 *Response tailored for New Joiners — clear, step-by-step guidance provided.*\n\n',
    director: '> 🎯 *Executive summary prioritised for Director-level audience.*\n\n',
    internal_auditor: '> 🔎 *Audit-focused response with evidence and control emphasis.*\n\n',
    compliance_officer: '> ✅ *Regulatory requirements and compliance obligations highlighted.*\n\n',
    risk_owner: '> 🛡️ *Risk identification and mitigation strategy emphasis.*\n\n',
  };
  const personaNote = personaGreetings[persona] || '';

  // Domain-specific rich answers
  const answers: Record<string, string> = {
    audit: `${personaNote}**📋 Summary**
Audit readiness at Deutsche Bank requires continuous preparation, documented controls, and clear evidence of control effectiveness across all three lines of defense.

**📖 Detailed Explanation**
Internal audit at Deutsche Bank follows a **risk-based audit approach** aligned to the IIA Standards and Deutsche Bank's Internal Audit Charter. The key phases are:

1. **Planning** — Risk assessment, scoping, and audit programme design
2. **Fieldwork** — Evidence gathering, control testing, walkthroughs
3. **Reporting** — Findings, ratings (Critical/High/Medium/Low), management responses
4. **Follow-up** — Tracking remediation of agreed actions to closure

**Control Testing Methodology:**
| Test Type | Purpose | Frequency |
|---|---|---|
| Design Effectiveness | Is control correctly designed? | Annual |
| Operating Effectiveness | Is control working as intended? | Quarterly/Annual |
| Substantive Testing | Validate balances and transactions | As required |

**💼 Business Value**
Strong audit readiness reduces audit findings, accelerates external audit cycles, and demonstrates robust governance to regulators including the BaFin, ECB, and FCA.

**🌟 Best Practices**
- Never surprise an auditor — proactive disclosure builds trust
- Evidence should be contemporaneous, not reconstructed
- Aim for zero repeat findings from prior audit cycles
- Management responses must be specific, measurable, and time-bound

**🔗 Related Domains**
Risk Management · Controls Framework · Compliance · Governance`,

    risk: `${personaNote}**📋 Summary**
Deutsche Bank's Risk Management Framework is built on the Three Lines of Defense model, with RCSA as the primary operational risk tool to identify, assess, and mitigate risks.

**📖 Detailed Explanation**
**Three Lines of Defense:**
- **1st Line** — Business units own and manage their risks day-to-day
- **2nd Line** — Risk Management and Compliance provide oversight and challenge
- **3rd Line** — Internal Audit provides independent assurance

**Risk and Control Self-Assessment (RCSA):**
The RCSA process requires each business unit to:
1. **Identify** all material risks in their processes
2. **Assess** inherent risk (likelihood × impact before controls)
3. **Map controls** that mitigate each identified risk
4. **Rate residual risk** (remaining risk after controls)
5. **Escalate** any risks exceeding risk appetite

**Risk Rating Matrix:**
| Likelihood | Low Impact | Medium Impact | High Impact |
|---|---|---|---|
| High | Medium | High | Critical |
| Medium | Low | Medium | High |
| Low | Low | Low | Medium |

**Key Risk Indicators (KRIs):**
- Monitor weekly; breach triggers escalation to Risk Owner
- Material breaches escalated within **5 business days**
- Reported in monthly Risk Dashboard to Senior Management

**💼 Business Value**
Effective risk management protects Deutsche Bank's capital, reputation, and licence to operate, and demonstrates to regulators that risks are understood and managed proactively.

**🔗 Related Domains**
Controls Framework · Audit & Assurance · Compliance · Governance`,

    compliance: `${personaNote}**📋 Summary**
Deutsche Bank's Compliance Framework covers regulatory obligations across GDPR, MiFID II, Basel III, PSD2, and AML/KYC requirements, with mandatory monitoring, reporting, and breach management procedures.

**📖 Detailed Explanation**
**Key Regulatory Frameworks:**

| Regulation | Scope | Key Requirement |
|---|---|---|
| **GDPR** | Data Protection | Lawful basis, data subject rights, breach notification within 72 hours |
| **MiFID II** | Markets | Best execution, client suitability, trade reporting |
| **Basel III** | Capital | Capital adequacy ratios, liquidity coverage, leverage ratio |
| **AML/KYC** | Financial Crime | Customer due diligence, PEP screening, suspicious activity reporting |
| **PSD2** | Payments | Strong customer authentication, open banking, fraud monitoring |

**Compliance Monitoring Programme:**
1. **Surveillance** — Real-time monitoring of communications and transactions
2. **Testing** — Periodic compliance testing of key obligations
3. **Attestation** — Annual compliance certification by all staff
4. **Training** — Mandatory annual compliance training (100% completion target)

**Breach Management:**
- Identify → Assess materiality → Notify (internal then regulatory if required)
- Regulatory breach notification: **within 72 hours** (GDPR), **immediately** (material market misconduct)

**💼 Business Value**
A strong compliance culture protects Deutsche Bank from regulatory fines, reputational damage, and enforcement action. Regulators expect proactive compliance, not reactive remediation.

**🔗 Related Domains**
Risk Management · Audit · Governance · Controls`,

    operations: `${personaNote}**📋 Summary**
Deutsche Bank Operations follows a **Customer First** principle with defined SLAs, incident management procedures, and escalation matrices to ensure service excellence and business continuity.

**📖 Detailed Explanation**
**Service Level Agreements (SLAs):**

| Priority | Description | Resolution Target |
|---|---|---|
| **P1 Critical** | Full service outage, major financial impact | 4 hours |
| **P2 High** | Significant degradation, client impact | 8 hours |
| **P3 Medium** | Partial impact, workaround available | 24 hours |
| **P4 Low** | Minor issue, minimal business impact | 72 hours |

**Incident Management Process:**
1. **Detection** — Automated monitoring or user report via ServiceNow
2. **Triage** — Assign priority, notify stakeholders, begin investigation
3. **Resolution** — Fix, test, and restore service
4. **Post-Incident Review** — Root cause analysis within 5 days for P1/P2
5. **Problem Management** — Prevent recurrence through permanent fix

**Escalation Matrix:**
- P1 incidents → Team Lead within 15 minutes → Manager within 30 minutes → Director within 1 hour
- All escalations must be **logged in ServiceNow** with timestamps

**Key Performance Indicators:**
- MTTR (Mean Time to Restore): Target < 4 hours for P1
- SLA Adherence: Target ≥ 98%
- First Call Resolution: Target ≥ 85%
- Customer Satisfaction: Target ≥ 4.2/5.0

**🔗 Related Domains**
Risk Management · Automation · Governance · Learning`,

    euda: `${personaNote}**📋 Summary**
EUDAs (End User Developed Applications) including spreadsheets, Access databases, and Python scripts require formal inventory, risk assessment, and annual certification under Deutsche Bank's EUDA Governance Policy.

**📖 Detailed Explanation**
**What is an EUDA?**
Any tool developed by business users (not IT) that is used to support business decisions or processes:
- Excel spreadsheets with macros/VBA
- Microsoft Access databases
- Python/R scripts
- Power BI reports with embedded logic
- Any tool not managed by IT as a formal application

**EUDA Classification:**
| Tier | Criteria | Requirements |
|---|---|---|
| **Tier 1 (High Risk)** | Material financial impact, regulatory reporting | Full documentation, IT review, quarterly testing |
| **Tier 2 (Medium Risk)** | Operational decision-making | Documentation, annual review, business owner sign-off |
| **Tier 3 (Low Risk)** | Personal productivity, no downstream impact | Basic inventory registration only |

**EUDA Inventory Requirements:**
1. Register ALL Tier 1 and Tier 2 EUDAs in the EUDA inventory system
2. Assign a named **Business Owner** (accountable) and **Technical Contact**
3. Document: purpose, users, inputs, outputs, controls, and data sources
4. Conduct annual **risk assessment** and recertification
5. Implement access controls, version control, and change management

**🔗 Related Domains**
Automation · Risk Management · Governance · Controls`,

    automation: `${personaNote}**📋 Summary**
Deutsche Bank's Automation Governance Framework requires all RPA bots and automated processes to have formal business ownership, documented controls, testing evidence, and real-time monitoring with fallback procedures.

**📖 Detailed Explanation**
**Automation Lifecycle:**
\`Design → Development → Testing → UAT → Go-Live → Monitor → Review → Retire\`

**Mandatory Requirements for All Automations:**

| Requirement | Detail |
|---|---|
| **Business Owner** | Named accountable person, non-IT |
| **Business Case** | Documented FTE savings, risk reduction, or quality improvement |
| **Test Evidence** | Unit testing, UAT, regression testing documented |
| **Fallback Procedure** | Manual process documented and tested if automation fails |
| **Monitoring** | Real-time alerting for failures, exceptions, and SLA breaches |
| **Change Management** | Formal approval for any changes post go-live |
| **Annual Review** | Business Owner recertifies automation annually |

**Automation Risk Controls:**
1. **Segregation of Duties** — Bot credentials must not have elevated permissions
2. **Data Validation** — Input and output validation at each processing step  
3. **Error Handling** — All exceptions logged and alerted to operations team
4. **Audit Trail** — Complete log of all bot actions with timestamps

**🔗 Related Domains**
EUDA · Risk Management · Controls · Operations`,

    governance: `${personaNote}**📋 Summary**
Deutsche Bank's Policy Governance Framework defines how policies are created, approved, communicated, and maintained, with mandatory annual certification by all employees and committee-based approval processes.

**📖 Detailed Explanation**
**Policy Hierarchy:**
\`Group Policy → Divisional Standard → Procedure → Guideline → Job Aid\`

**Policy Lifecycle:**
1. **Draft** — Policy Owner drafts with SME input
2. **Review** — Legal, Compliance, Risk review (60-day cycle)
3. **Approval** — Relevant Governance Committee approval
4. **Publication** — Published to PolicyNet, communicated to staff
5. **Attestation** — Annual certification by all in-scope employees
6. **Review** — Reviewed every 1-3 years or upon regulatory change
7. **Retire** — Formally retired when superseded or no longer relevant

**Governance Committees:**
| Committee | Frequency | Scope |
|---|---|---|
| Management Board | Monthly | Enterprise-wide governance |
| Operational Risk Committee | Quarterly | Operational risk and controls |
| Compliance Committee | Monthly | Regulatory compliance |
| Data Governance Council | Quarterly | Data quality and protection |

**Annual Certification:**
- All employees must certify reading and understanding applicable policies
- Completion tracked by HR; non-completion escalated to line manager
- Target: **100% completion** by December 31 each year

**🔗 Related Domains**
Compliance · Risk Management · Audit · Controls`,

    controls: `${personaNote}**📋 Summary**
Deutsche Bank's Controls Framework, based on COSO principles and the three lines of defense, requires all material risks to have effective preventive, detective, and corrective controls with documented testing evidence.

**📖 Detailed Explanation**
**Control Types:**
| Type | Description | Example |
|---|---|---|
| **Preventive** | Stop errors before they occur | Dual authorization, access controls |
| **Detective** | Identify errors after they occur | Reconciliations, exception reports |
| **Corrective** | Fix errors after detection | Error correction procedures, rollback |

**Control Design Principles (COSO):**
1. **Control Environment** — Tone from the top, values, and accountability
2. **Risk Assessment** — Regular identification of risks that controls must address
3. **Control Activities** — Specific policies and procedures that constitute controls
4. **Information & Communication** — Internal reporting and external communication
5. **Monitoring** — Continuous monitoring and periodic evaluations

**Control Testing:**
\`\`\`
For each key control:
1. Define: What should the control do?
2. Test design: Is the control correctly designed?
3. Test operation: Did the control operate effectively for the period?
4. Document: Record test steps, sample, result, and conclusion
5. Rate: Effective / Partially Effective / Ineffective
6. Remediate: Fix any identified gaps within agreed timeframes
\`\`\`

**Control Deficiency Ratings:**
- **Control Deficiency** — Minor gap, limited impact
- **Significant Deficiency** — Moderate gap, could lead to material misstatement
- **Material Weakness** — Severe gap, likely to lead to material misstatement

**🔗 Related Domains**
Risk Management · Audit · Governance · Compliance`,

    learning: `${personaNote}**📋 Summary**
Deutsche Bank's Learning & Development Framework provides structured onboarding, mandatory training, and continuous professional development pathways for all employees across all levels and functions.

**📖 Detailed Explanation**
**Onboarding Programme (New Joiners):**

| Week | Focus | Activities |
|---|---|---|
| Week 1 | Orientation | DB culture, values, org structure, IT setup |
| Week 2-4 | Role Foundation | Function-specific training, process walkthroughs |
| Month 2-3 | Integration | Shadowing, practical assessments, first deliverables |
| Month 4-6 | Independence | Full role ownership with manager support |
| Month 12 | Review | First annual performance review |

**Mandatory Training (All Employees):**
- ✅ Anti-Money Laundering (AML) — Annual
- ✅ Data Protection & GDPR — Annual
- ✅ Code of Conduct — Annual
- ✅ Cyber Security Awareness — Annual
- ✅ Information Security — Annual
- ✅ Compliance Attestation — Annual

**Learning Platforms:**
- **DB Learning** — Primary LMS for all mandatory and optional training
- **LinkedIn Learning** — Continuous development library
- **Degreed** — Personalised learning pathways
- **External Certifications** — FRM, CFA, CISA, PRINCE2 (supported with study leave)

**🔗 Related Domains**
HR Management · Governance · Operations`,

    hr: `${personaNote}**📋 Summary**
Deutsche Bank's HR Framework covers the complete employee lifecycle — from recruitment and onboarding through performance management, development, and offboarding — aligned to DB's Code of Conduct and People Strategy.

**📖 Detailed Explanation**
**Performance Management Cycle:**

| Phase | Timing | Activity |
|---|---|---|
| **Goal Setting** | January–February | Set SMART objectives, aligned to team/division goals |
| **Mid-Year Review** | June–July | Progress check, feedback, goal adjustment |
| **Year-End Review** | November–December | Final assessment, performance rating, calibration |
| **Compensation Review** | January | Salary review, bonus decisions, promotion consideration |

**Performance Ratings:**
- **Outstanding (5)** — Significantly exceeds all expectations
- **Exceeds Expectations (4)** — Consistently goes above requirements
- **Meets Expectations (3)** — Delivers on all key objectives
- **Partially Meets (2)** — Some gaps against objectives; improvement plan required
- **Does Not Meet (1)** — Significant gaps; formal PIP initiated

**Leave Entitlements (Standard):**
- Annual Leave: 25 days (increases with seniority)
- Sick Leave: Covered per DB sick pay policy
- Parental Leave: Enhanced maternity (26 weeks) and paternity (4 weeks) leave
- Study Leave: Up to 5 days per year for approved qualifications

**Key HR Policies:**
- Flexible Working — Hybrid model (minimum 3 days in office for most roles)
- Dignity at Work — Zero tolerance for harassment and discrimination
- Whistleblowing — Safe reporting channels with full protection for reporters

**🔗 Related Domains**
Learning & Development · Governance · Operations`,
  };

  const answer = answers[detectedDomain] || answers['operations'];

  const suggestionsByDomain: Record<string, string[]> = {
    audit:       ['What evidence is needed for a P1 control?', 'How do I respond to an audit finding?', 'Top 10 Audit Readiness Actions', 'What is the audit rating scale?'],
    risk:        ['How do I complete an RCSA?', 'What are Key Risk Indicators?', 'Explain risk appetite vs. risk tolerance', 'Top 10 Operational Risk Controls'],
    compliance:  ['What are the GDPR breach notification requirements?', 'How do I report a compliance breach?', 'Top 10 MiFID II Compliance Checks', 'What is AML screening?'],
    operations:  ['What is the P1 incident SLA?', 'How do I escalate a critical incident?', 'Top 10 Operational Best Practices', 'What KPIs should I monitor?'],
    euda:        ['How do I classify my EUDA?', 'What is required in the EUDA inventory?', 'Top 10 EUDA Management Actions', 'How do I migrate an EUDA to IT?'],
    automation:  ['What governance is needed for an RPA bot?', 'What fallback procedures are required?', 'Top 10 Automation Best Practices', 'How do I monitor automations?'],
    governance:  ['How is a policy approved?', 'What committees govern policy?', 'Top 10 Governance Best Practices', 'What is the policy attestation process?'],
    controls:    ['What is the difference between preventive and detective controls?', 'How do I test control effectiveness?', 'Top 10 Controls Best Practices', 'What is a material weakness?'],
    learning:    ['What mandatory training do I need?', 'How does the onboarding programme work?', 'What certifications does DB support?', 'Top 10 Onboarding Tips'],
    hr:          ['How does the performance review work?', 'What is DB flexible working policy?', 'Top 10 HR Management Practices', 'How do I request study leave?'],
  };

  return {
    answer,
    domain_detected: detectedDomain,
    suggested_questions: suggestionsByDomain[detectedDomain] || suggestionsByDomain['operations'],
    sources: [
      {
        content: `Deutsche Bank ${detectedDomain.charAt(0).toUpperCase() + detectedDomain.slice(1)} Policy — Section 3.1: Core Requirements`,
        metadata: { domain: detectedDomain, title: `DB ${detectedDomain.charAt(0).toUpperCase() + detectedDomain.slice(1)} Framework v2.4` },
        relevance_score: 0.94,
      },
      {
        content: `Enterprise Knowledge Base — ${detectedDomain.toUpperCase()} Domain Standard Operating Procedure`,
        metadata: { domain: detectedDomain, title: 'SOP Reference Guide 2026' },
        relevance_score: 0.87,
      },
    ],
    response_time: parseFloat((0.8 + Math.random() * 0.6).toFixed(2)),
  };
}

export const chatApi = {
  /** Send a chat message — tries backend first, falls back to demo engine */
  sendMessage: async (params: {
    question: string;
    persona: string;
    domain?: string | null;
    conversation_history?: ChatMessage[];
    session_id?: string;
  }) => {
    try {
      const { data } = await apiClient.post('/api/chat/message', params);
      return data;
    } catch {
      // ── Backend offline: use built-in demo response engine ─────────────────
      await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800)); // realistic delay
      return buildDemoResponse(params.question, params.persona, params.domain);
    }
  },

  /** Generate Top 10 list — tries backend, falls back to demo */
  generateTop10: async (params: { topic: string; domain?: string; persona?: string }) => {
    try {
      const { data } = await apiClient.post('/api/chat/top10', params);
      return data;
    } catch {
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 500));
      const persona = params.persona || 'operations_analyst';
      return {
        response: buildTop10Response(params.topic, params.domain || 'operations', persona),
      };
    }
  },

  /** Get suggested prompts */
  getSuggestions: async (persona: string, domain?: string) => {
    try {
      const { data } = await apiClient.get('/api/chat/suggestions', {
        params: { persona, domain },
      });
      return data.suggestions as string[];
    } catch {
      return [
        'What are the SLA requirements for Operations?',
        'Explain the Three Lines of Defense model',
        'Top 10 Audit Readiness Actions',
        'How do I register an EUDA?',
        'What mandatory training do I need as a new joiner?',
      ];
    }
  },
};

function buildTop10Response(topic: string, domain: string, _persona: string): string {
  const domainItems: Record<string, string[]> = {
    audit: [
      '**Maintain a Live Controls Inventory** — Keep your controls register up-to-date with owners, test dates, and effectiveness ratings at all times',
      '**Prepare Evidence Packs in Advance** — Do not wait for auditors to request evidence; maintain ready-to-share documentation for all key controls',
      '**Conduct Pre-Audit Self-Assessments** — Run a mock audit using the audit methodology 60 days before any scheduled review',
      '**Resolve Prior Findings Before Deadline** — Track all open findings with owners, target dates, and RAG status; escalate overdue items',
      '**Train Control Owners on Audit Process** — Ensure every control owner knows their responsibilities and how to respond to audit queries',
      '**Maintain Audit Trails for All Critical Processes** — Every decision, approval, and exception should be logged with timestamp and authoriser',
      '**Document Root Cause for Every Finding** — Surface findings should lead to systemic fixes, not just symptomatic corrections',
      '**Establish an Issues Management Process** — Track all audit points, management actions, and evidence of completion through a formal tracker',
      '**Align with Internal Audit\'s Risk Universe** — Understand the audit plan and ensure highest-risk areas have strongest controls',
      '**Foster a Culture of Continuous Improvement** — Use audit findings as learning opportunities to strengthen the overall control environment',
    ],
    risk: [
      '**Complete RCSA Quarterly** — Risk and Control Self-Assessments must be updated at least quarterly or upon material business change',
      '**Register All Risks Promptly** — Any identified risk must be logged in the risk system within 5 business days of identification',
      '**Assign Named Risk Owners** — Every risk must have a single accountable owner who manages and reports on that risk',
      '**Set Up KRI Monitoring Dashboards** — Key Risk Indicators must be tracked weekly with automated alerts for threshold breaches',
      '**Escalate High and Critical Risks Immediately** — Risks rated High or Critical must be escalated to the CRO and Risk Committee',
      '**Maintain Risk Appetite Awareness** — Understand your division\'s risk appetite and ensure activities remain within approved tolerances',
      '**Implement Preventive Controls First** — Prioritise controls that prevent risk materialisation over purely detective controls',
      '**Conduct Stress Testing for Material Risks** — Test how key risks behave under adverse conditions to validate control effectiveness',
      '**Review Risk Register at Monthly Team Meetings** — Risk management should be a standing agenda item for all operational meetings',
      '**Apply Lessons Learned from Loss Events** — Internal and external loss events are valuable data for improving risk identification',
    ],
    compliance: [
      '**Complete All Mandatory Training Annually** — AML, GDPR, Code of Conduct, and Cyber Security training must be completed by December 31',
      '**Maintain a Compliance Obligations Register** — Know which regulations apply to your role and how you comply with each requirement',
      '**Report Breaches Immediately** — Never self-remediate a compliance breach; report to Compliance immediately for proper handling',
      '**Implement Pre-Trade Compliance Checks** — All regulated activities should have pre-approval or automated compliance screening',
      '**Conduct Regular Compliance Monitoring** — Periodic self-assessments against regulatory obligations identify gaps before regulators do',
      '**Manage Data Subject Requests Promptly** — GDPR requests must be acknowledged within 72 hours and fulfilled within 30 days',
      '**Screen All Counterparties Against Sanction Lists** — No transactions with sanctioned entities; screening must be documented',
      '**Maintain Client Suitability Records** — All advice and product recommendations must be documented with suitability assessment',
      '**Attend Annual Compliance Briefings** — Stay current on regulatory changes affecting your business area',
      '**Embed a Compliance-First Mindset** — Compliance is not a checklist; it\'s a culture of doing the right thing every day',
    ],
    operations: [
      '**Respond to P1 Incidents Within 15 Minutes** — Critical incidents require immediate response; set up automated alerting',
      '**Maintain Up-to-Date Runbooks** — Operational runbooks must be reviewed quarterly and accessible to all team members',
      '**Conduct Daily Service Health Checks** — Start each business day with a service health review before markets open',
      '**Document All Escalations in ServiceNow** — Every escalation must be logged with timestamps and resolution details',
      '**Monitor SLA Performance Weekly** — Track actual vs. target SLA performance and investigate any breaches',
      '**Perform Root Cause Analysis for All P1/P2 Incidents** — Completed within 5 business days with preventive actions',
      '**Test Business Continuity Plans Quarterly** — Validate that fallback procedures work before they are needed in a crisis',
      '**Implement Automated Monitoring for Critical Processes** — Reduce reliance on manual checks; automate alerting where possible',
      '**Hold Post-Implementation Reviews** — Every major change should be reviewed 30 days post go-live for unintended consequences',
      '**Share Operational Lessons Learned** — Monthly lessons-learned sessions prevent repeat incidents across the team',
    ],
    governance: [
      '**Complete Annual Policy Certification** — All employees must certify understanding of applicable policies by year-end',
      '**Review PolicyNet Quarterly** — Check for new or updated policies relevant to your role every quarter',
      '**Follow Formal Exception Process** — Policy exceptions must never be self-approved; use the formal exception request process',
      '**Maintain Current Procedure Documents** — Business unit procedures must be reviewed annually and updated to reflect current practice',
      '**Participate in Governance Committees** — Attend or appoint a delegate to all governance forums relevant to your area',
      '**Escalate Policy Conflicts to Compliance** — If business needs conflict with policy, escalate rather than work around',
      '**Implement Version Control for All Policies** — Track all changes with author, date, and reason for change',
      '**Communicate Policy Changes Proactively** — When policies change, actively communicate impact to affected staff',
      '**Conduct Annual Governance Effectiveness Review** — Assess whether governance structures are working as intended',
      '**Align Local Procedures to Group Policy** — Regularly reconcile business-unit procedures against Group Policies for gaps',
    ],
  };

  const items = domainItems[domain] ||
    domainItems['operations'] ||
    Array.from({ length: 10 }, (_, i) => `**Action ${i + 1}** — Key initiative for ${topic}`);

  const numbered = items
    .slice(0, 10)
    .map((item, i) => `${i + 1}. ${item}`)
    .join('\n\n');

  return `## 🏆 Top 10: ${topic}

> *AI-generated based on Deutsche Bank enterprise knowledge base · Demo Mode*

---

${numbered}

---

**📌 Summary**
These 10 actions represent the highest-impact steps for **${topic}** within the Deutsche Bank context. Each action is aligned to regulatory expectations, internal policy, and operational best practices. Prioritise items 1–3 for immediate action, and establish monitoring for items 4–10.

*Start the FastAPI backend with a Google API key to get fully personalised, RAG-powered responses from your actual knowledge base.*`;
}
