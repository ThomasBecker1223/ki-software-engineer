---
name: requirements-interview
description: Interview the user step by step about a feature or requirement, clarify goals, constraints, and scope, and produce a user story with testable Given/When/Then acceptance criteria and technical notes. Use when requirements need discovery or clarification before implementation.
---

# Requirements interview

Turn a feature idea into a clear, implementable requirement through a short conversation with the user.
The deliverable is a user story, acceptance criteria, and technical notes. Interview and document the
requirement; do not begin implementation or treat technical suggestions as approved scope.

## Start from existing context

Read the user's request and available task context first. Reuse answers already supplied in the conversation,
an identified issue, or a calling skill's brief. If the active task itself is missing, use the available
`recover-context` skill before interviewing; do not choose a requirement from the backlog on the user's behalf.

Inspect relevant repository guidance and source when they can answer implementation questions. In this
project, `AGENTS.md` defines working constraints and `ARCHITECTURE.md` provides technical context; neither
establishes product intent. If repository access is unavailable, say so and leave technical observations
unverified rather than presenting guesses as facts.

Begin by briefly restating the understood feature. If no feature was supplied, ask which feature or problem
the user wants to explore. Do not invent an example feature and interview against it.

## Interview one step at a time

Ask one focused question per turn and wait for the answer before choosing the next question. Use an available
user-input tool when appropriate, or ask directly in conversation. Offer a few meaningful options when they
help the user decide, while allowing a free-text answer. Label a recommendation as a recommendation, not a
confirmed decision. Missing answers and elapsed time are not agreement.

Choose questions according to what is still unknown, generally progressing through:

1. **Problem and goal:** Who needs the feature, what problem do they face, and what outcome would count as success?
2. **User flow:** What triggers the behavior, what does the user do, and what result should they observe?
3. **Scope:** What belongs in the first version, what is excluded, and what existing behavior must be preserved?
4. **Constraints:** Relevant business rules, data or permissions, compatibility, accessibility, performance,
   delivery constraints, and dependencies. Ask only about constraints that can materially affect this feature.
5. **Acceptance:** Clarify realistic examples, boundaries, and failure/recovery behavior needed to make success testable.

These are interview topics, not a form to ask in full. Skip questions already answered or discoverable from
the repository. When the answer exposes a conflict, ask about that conflict before advancing. Briefly recap
material decisions at natural transitions so the user can correct the understanding without repeating the
whole interview. Preserve later corrections and remove superseded decisions from the final story.

Avoid asking the user to choose implementation details that the repository already determines. Ask technical
tradeoff questions only when they change user-visible behavior, scope, cost, or a meaningful constraint.
Distinguish a user requirement from a proposed implementation approach.

## Decide when the requirement is ready

Finish when the actor, goal, primary flow, scope, material constraints, and observable success conditions are
clear enough to write testable acceptance criteria. Resolve high-impact ambiguities before presenting the
story as ready for implementation. Do not prolong the interview to fill irrelevant categories.

If the user asks to stop, skip a question, or receive a draft early, provide the best supported draft and mark
unresolved questions explicitly. Do not invent answers or call a materially incomplete draft implementation-ready.
When the initial brief already contains enough information, produce the story without repeating the interview.

## Produce the requirement

Write in the user's language, using this structure and omitting irrelevant optional sections:

- **Title:** A short feature name.
- **User story:** "As a [actor], I want [capability], so that [benefit]."
- **Scope and constraints:** Confirmed boundaries, business rules, and behavior to preserve, including explicit exclusions.
- **Acceptance criteria:** Numbered scenarios, each with **Given** a concrete precondition, **When** a specific
  trigger/action occurs, and **Then** an observable result. Use **And** only to extend a scenario. Cover the
  successful flow and the relevant negative/boundary cases established during the interview. Replace vague
  words such as "fast" or "user-friendly" with agreed measurable conditions; otherwise flag them as unresolved.
- **Technical notes:** Relevant verified existing components, interfaces, data flow, dependencies, and validation
  considerations. Separate confirmed technical constraints from suggested approaches. Reference repository
  paths only when inspected, and do not invent schemas, endpoints, dependencies, or delivery estimates.
- **Open questions / assumptions:** Clearly labeled uncertainties and proposals that still need a decision.
  If any affect acceptance materially, label the result as a draft.

Keep criteria focused on behavior rather than the chosen component structure. Technical notes must not
silently introduce additional acceptance criteria. If the capability contains independent user outcomes,
suggest a split and clarify the boundary instead of producing an oversized story.

Return the story in conversation or to the calling skill. Save it to a file or issue only when requested,
using the specified destination; do not create an issue, edit code, or claim tests have passed as part of
this interview. Apply subsequent user feedback as a revision of the same requirement.
