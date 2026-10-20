# Product brief and problem understanding
## Problem
LLM-powered applications follow user requests, process retrieved text, and sometimes access tools. Malicious instructions embedded in prompts or documents can cause policy violations or unauthorized actions. Teams need controlled, repeatable red-team tests without allowing untrusted workloads to access production data, networks, or credentials.

## Our solution
AI Red-Team Arena is a developer-oriented controlled experiment platform. It configures an experiment, runs curated attacks on a purpose-built demo assistant within constrained workloads, applies guardrails, evaluates responses against expected rules, and keeps a traceable record.

## Target user and job-to-be-done
Primary: developers/AI product security engineers who must validate AI app guardrails before release. Secondary: security researchers, startups, education teams. Job: 'Show me whether known prompt injection scenarios succeed, and whether my fix prevents regression.'

## Example story
A demo internal knowledge assistant has public vacation policy and a synthetic employee private record identified by a canary string. Without authorization controls, a malicious retrieved-text instruction may induce a disclosure. With an authorization gate, it must refuse; exact same case reruns generate measurable evidence. No real private records.

## Innovation claim (planned, not validated)
Value comes from combining *restricted execution + reproducible attack fixtures + deterministic evaluation + before/after verification + audit trail*. Not merely a prompt classification chatbot.

## Assumptions / open questions
- Whether official full problem statement imposes additional hard security constraints: **UNVERIFIED**; review organizers' original doc.
- Hosting/deployment requirements: **TBD**.
- API provider: optional and provider-agnostic; local mock mode required.
- Team should confirm available hardware and Docker compatibility.

## Explicit non-goals
Automated scanning of third-party apps, remote exploitation, credential theft, real exfiltration, production integrations, autonomous offensive tooling, payment systems, multi-tenant enterprise operations.
