import type { Subtest } from "@/lib/ucat-lessons";

// Situational Judgement. Every scenario is written for this site. The keys follow the GMC's Good
// Medical Practice and Achieving Good Medical Practice for students, which is what UCAT keys to.

export const SJT: Subtest = {
  key: "sjt",
  name: "Situational Judgement",
  intro: "Realistic scenarios — mostly medical and dental students and clinical teams — where you rate how appropriate a response is, or how important a consideration is. It tests the professional behaviour expected of a doctor or dentist, not medical knowledge. Scored in bands, 1 (best) to 4.",
  questions: 69,
  minutes: 26,
  lessons: [
    {
      slug: "how-it-works",
      title: "How Situational Judgement works",
      summary: "The two question types, banded partial-credit scoring, and the golden rules that apply to every scenario.",
      minutes: 10,
      sections: [
        {
          heading: "The format",
          blocks: [
            { kind: "p", text: "69 questions in 26 minutes, across around 20 scenarios with two to six questions each — about 22 seconds a question, the most generous pace in the test. Each question asks you to rate one response or consideration on a four-point scale." },
            { kind: "table", head: ["Task", "Scale"], rows: [
              ["Appropriateness", "Very appropriate · Appropriate, but not ideal · Inappropriate, but not awful · Very inappropriate"],
              ["Importance", "Very important · Important · Of minor importance · Not important at all"],
            ] },
          ],
        },
        {
          heading: "Scoring",
          blocks: [
            { kind: "p", text: "The keyed answer earns full marks; an answer one step away on the scale earns partial marks; further away earns nothing. So being nearly right still counts — never leave a question blank. Your raw score becomes a band from 1 to 4, reported separately from the other subtests' scores." },
          ],
        },
        {
          heading: "Golden rules",
          blocks: [
            { kind: "list", items: [
              "Judge the action, not the scenario. You are rating what someone does in response, not the situation they are in.",
              "Make no assumptions. Take the scenario as written; don't add facts that would make an option better or worse.",
              "No medical knowledge is needed or rewarded.",
              "Give the textbook answer — what the ideal professional should do, not what most people would do.",
              "Rate each response on its own. Several can share a rating, and responses are not alternatives to each other.",
              "An action does not have to solve everything to be very appropriate. It just has to be the right thing to do.",
            ] },
            { kind: "tip", text: "Speed comes from consistency. Decide your approach to the common themes now — honesty, confidentiality, patient safety, escalation — so you are not re-deciding in the exam." },
          ],
        },
      ],
      terms: [
        { term: "Band", definition: "The reported SJT result: Band 1 is the highest, Band 4 the lowest." },
        { term: "Keyed answer", definition: "The rating the test-setters judge correct, decided by an expert panel." },
        { term: "Partial credit", definition: "Marks given for an answer one step from the key." },
      ],
      examples: [],
      practice: [
        {
          kind: "mcq", id: "sjt-hw-p1",
          prompt: "The key for a response is 'Appropriate, but not ideal'. You answer 'Very appropriate'. What do you score?",
          options: ["Full marks", "Partial marks", "No marks", "A negative mark"], answer: 1,
          explanation: "Your answer is one step from the key, so it earns partial credit. There is no negative marking.",
        },
      ],
    },
    {
      slug: "appropriateness",
      title: "Rating appropriateness",
      summary: "A two-step method for placing any response on the scale, and the words that give it away.",
      minutes: 14,
      sections: [
        {
          heading: "Two steps",
          blocks: [
            { kind: "list", ordered: true, items: [
              "Overall, is the response positive (it helps) or negative (it harms or neglects something)?",
              "Is it purely so, or mixed — does a good action have a downside, or a bad one some merit?",
            ] },
            { kind: "table", head: ["Response is…", "Rating"], rows: [
              ["Entirely positive", "A very appropriate thing to do"],
              ["Mixed, positive on balance", "Appropriate, but not ideal"],
              ["Mixed, negative on balance", "Inappropriate, but not awful"],
              ["Entirely negative", "A very inappropriate thing to do"],
            ] },
          ],
        },
        {
          heading: "Words that tip the balance",
          blocks: [
            { kind: "table", head: ["Usually positive", "Usually negative"], rows: [
              ["honestly, calmly", "threaten, confront"],
              ["explore, listen, ask", "shout, accuse, blame"],
              ["support, encourage", "avoid, ignore, refuse"],
              ["suggest, discuss privately", "hide, cover up, gossip"],
            ] },
            { kind: "p", text: "These are a guide, not a rule — 'explore' at the wrong moment, or 'refuse' to do something unsafe, can flip the meaning. Read the whole response." },
          ],
        },
        {
          heading: "Common mixed responses",
          blocks: [
            { kind: "list", items: [
              "The right action at the wrong time or place (raising a concern in front of a patient).",
              "Escalating before trying the obvious first step yourself.",
              "Doing the right thing but delaying it without reason ('wait until next week').",
              "Fixing the immediate problem but not the underlying one.",
            ] },
          ],
        },
      ],
      terms: [
        { term: "Pure response", definition: "One that is entirely helpful or entirely harmful." },
        { term: "Mixed response", definition: "One with both a good and a bad side; it belongs in the middle two ratings." },
        { term: "Escalate", definition: "Raise a problem with someone more senior or responsible." },
      ],
      examples: [
        {
          kind: "rating", id: "sjt-ap-e1",
          stimulus: [{ kind: "p", text: "Amira, a third-year medical student, is on a ward placement. She notices that Callum, a fellow student, has twice arrived smelling strongly of alcohol, and today he seemed unsteady while talking to a patient." }],
          prompt: "How appropriate are each of the following responses by Amira?",
          scale: "appropriate",
          items: [
            { text: "Speak to Callum privately to ask if he is all right and share what she has noticed.", answer: 0, why: "Supportive, private, and gives him the chance to explain. It is the obvious first step." },
            { text: "Tell the ward sister immediately, in front of the patient, that Callum is drunk.", answer: 2, why: "Patient safety matters, so raising it has merit — but doing it publicly, as an accusation, before knowing the facts is unprofessional." },
            { text: "Inform her clinical supervisor about her concerns.", answer: 0, why: "Patient safety may be at risk; a supervisor is the right person and this is not 'telling tales'." },
            { text: "Ignore it, since it is not her responsibility.", answer: 3, why: "Every student has a duty to raise concerns about patient safety. Doing nothing is never right here." },
            { text: "Tell the other students on the placement so they can keep an eye on him.", answer: 3, why: "Gossip that harms Callum and does nothing to protect patients." },
          ],
        },
      ],
      practice: [
        {
          kind: "rating", id: "sjt-ap-p1",
          stimulus: [{ kind: "p", text: "Josh, a dental student, is in a group project. One member, Hana, has not contributed to the last three meetings, and the deadline is in a week. The others are frustrated." }],
          prompt: "How appropriate are each of the following responses by Josh?",
          scale: "appropriate",
          items: [
            { text: "Message Hana privately to ask whether anything is affecting her work and how the group can help.", answer: 0, why: "Explores the cause and offers support before anything else." },
            { text: "Complain to the course tutor straight away without speaking to Hana.", answer: 2, why: "The tutor may need to know eventually, but skipping a conversation with Hana first is premature." },
            { text: "Suggest at the next meeting that the group re-divide the remaining tasks clearly, with Hana included.", answer: 1, why: "Practical and inclusive, but it does not find out why she has disengaged." },
            { text: "Post in the group chat that Hana is lazy and should be removed.", answer: 3, why: "Public, accusatory and unhelpful." },
          ],
        },
        {
          kind: "rating", id: "sjt-ap-p2",
          stimulus: [{ kind: "p", text: "Priya, a medical student, is shadowing a GP. A patient she recognises as her neighbour's son comes in. After the consultation, the neighbour phones Priya to ask what was wrong with him." }],
          prompt: "How appropriate are each of the following responses by Priya?",
          scale: "appropriate",
          items: [
            { text: "Politely explain that she cannot discuss anything about patients she has seen.", answer: 0, why: "Maintains confidentiality honestly and courteously." },
            { text: "Tell the neighbour it was nothing serious, without giving details.", answer: 3, why: "Even confirming he attended, or hinting at the outcome, breaches confidentiality." },
            { text: "Suggest the neighbour talk to her son about it.", answer: 1, why: "A sensible redirection, but on its own it does not make clear that Priya cannot share anything." },
            { text: "Hang up without saying anything.", answer: 2, why: "Keeps the confidence but is rude and leaves the neighbour without an explanation." },
          ],
        },
      ],
    },
    {
      slug: "importance",
      title: "Rating importance",
      summary: "What each importance rating means, and how to tell a consideration that must drive the decision from one that should not.",
      minutes: 12,
      sections: [
        {
          heading: "What the ratings mean",
          blocks: [
            { kind: "table", head: ["Rating", "Meaning"], rows: [
              ["Very important", "Must be taken into account — ignoring it would be wrong."],
              ["Important", "Should be taken into account."],
              ["Of minor importance", "Could be taken into account, but it should not decide things."],
              ["Not important at all", "Should not be taken into account at all."],
            ] },
          ],
        },
        {
          heading: "A reliable order",
          blocks: [
            { kind: "list", ordered: true, items: [
              "Patient safety and wellbeing.",
              "Honesty, confidentiality and the law.",
              "Duties to colleagues and the team; the person's own training and wellbeing.",
              "Convenience, reputation, personal feelings — usually minor or not important.",
            ] },
            { kind: "tip", text: "Ask: if this person ignored this consideration, would a senior be worried? Worried → very important or important. Indifferent → minor. Glad → not important at all." },
          ],
        },
      ],
      terms: [
        { term: "Consideration", definition: "A factor someone could weigh when deciding what to do." },
        { term: "Probity", definition: "Being honest and trustworthy — a core duty of any doctor or dentist." },
      ],
      examples: [
        {
          kind: "rating", id: "sjt-im-e1",
          stimulus: [{ kind: "p", text: "Leo, a final-year medical student, realises he gave a patient the wrong leaflet about their medication an hour ago. The patient is still on the ward. Leo is due at a teaching session in ten minutes." }],
          prompt: "How important are each of the following considerations for Leo in deciding what to do?",
          scale: "important",
          items: [
            { text: "The patient might act on incorrect information about their medication.", answer: 0, why: "Patient safety: it must drive his decision." },
            { text: "He has a duty to be honest about his mistake.", answer: 0, why: "Openness about errors is a core professional duty." },
            { text: "He will be late for the teaching session.", answer: 2, why: "A real but minor cost, easily outweighed by patient safety." },
            { text: "Admitting the error might make his supervisor think less of him.", answer: 3, why: "Fear for his reputation must not affect the decision." },
          ],
        },
      ],
      practice: [
        {
          kind: "rating", id: "sjt-im-p1",
          stimulus: [{ kind: "p", text: "Ella, a second-year medical student, has been asked by a consultant to take a history from a patient. The patient, who is distressed, asks Ella to keep a worry 'just between us' and not tell the doctors." }],
          prompt: "How important are each of the following considerations for Ella in deciding how to respond?",
          scale: "important",
          items: [
            { text: "Information relevant to the patient's care may need to be shared with the clinical team.", answer: 0, why: "Confidentiality within the care team is normal, and she cannot promise secrecy." },
            { text: "The patient is distressed and needs reassurance.", answer: 1, why: "Her wellbeing matters and should shape how Ella responds, though it cannot override safe care." },
            { text: "Ella would like the patient to like her.", answer: 3, why: "Personal popularity has no place in the decision." },
            { text: "The consultant might be busy when Ella reports back.", answer: 2, why: "A practical point about timing, not about what she should do." },
          ],
        },
      ],
    },
    {
      slug: "core-values",
      title: "Integrity, confidentiality and patient safety",
      summary: "The professional values the keys rest on — honesty, confidentiality, staying within your remit, and when to speak up.",
      minutes: 14,
      sections: [
        {
          heading: "Honesty and probity",
          blocks: [
            { kind: "list", items: [
              "Be honest about mistakes, quickly, to the right people.",
              "Never withhold information or tell a 'white lie' to spare someone's feelings or protect a colleague.",
              "Never claim work, attendance or skills that are not yours — signing in a friend is dishonest, not kind.",
            ] },
          ],
        },
        {
          heading: "Confidentiality",
          blocks: [
            { kind: "p", text: "Patient information is shared only with those caring for the patient, or with the patient's consent. It is broken without consent only in rare cases — usually a serious risk to the patient's or someone else's life or safety — and then by the senior team, not by a student acting alone." },
          ],
        },
        {
          heading: "Remit and speaking up",
          blocks: [
            { kind: "list", items: [
              "Know your limits. A student does not give results, change treatment or give medical advice — they pass the question to someone who can.",
              "Seeking senior help is a positive action, but don't use it to pass off a problem you could reasonably handle yourself first.",
              "Patient safety outranks hierarchy. If a senior's action seems unsafe, raise it — politely, privately where possible, and escalate if the risk remains.",
            ] },
          ],
        },
      ],
      terms: [
        { term: "Remit", definition: "The tasks and decisions within someone's role and competence." },
        { term: "Raising concerns", definition: "Telling someone responsible about a risk to patients — expected of every student and doctor." },
        { term: "Good Medical Practice", definition: "The GMC's guidance on the standards expected of doctors; SJT keys follow it." },
      ],
      examples: [
        {
          kind: "rating", id: "sjt-cv-e1",
          stimulus: [{ kind: "p", text: "Sam, a medical student, is sitting with a patient waiting for blood test results. The results appear on the ward computer while the doctor is away. The patient asks Sam what they say." }],
          prompt: "How appropriate are each of the following responses by Sam?",
          scale: "appropriate",
          items: [
            { text: "Explain that he is not able to give results, and that he will ask the doctor to come and discuss them.", answer: 0, why: "Honest, within his remit, and acts to get the patient an answer." },
            { text: "Read the results out, since the patient has a right to know.", answer: 3, why: "Outside his remit — he cannot interpret or explain them, and might cause harm." },
            { text: "Say he hasn't seen them yet.", answer: 3, why: "A lie, however well meant." },
            { text: "Tell the patient the results are back and the doctor will explain them, then carry on with his own work.", answer: 1, why: "Honest, but he should make sure the doctor actually knows the patient is waiting." },
          ],
        },
      ],
      practice: [
        {
          kind: "rating", id: "sjt-cv-p1",
          stimulus: [{ kind: "p", text: "During a lecture, Noor, a medical student, sees her friend Ben sign the attendance sheet for another student who is absent. Attendance counts towards progression." }],
          prompt: "How appropriate are each of the following responses by Noor?",
          scale: "appropriate",
          items: [
            { text: "Speak to Ben after the lecture, explain why it is dishonest and encourage him to correct the sheet.", answer: 0, why: "Addresses it directly and supportively, and gives Ben the chance to put it right." },
            { text: "Report Ben to the faculty without speaking to him first.", answer: 2, why: "Dishonesty may need reporting eventually, but going straight over his head skips the obvious first step." },
            { text: "Say nothing — it does no harm to patients.", answer: 3, why: "Probity matters in itself; ignoring dishonesty is not acceptable." },
            { text: "Ask the absent student to tell Ben not to do it again.", answer: 2, why: "It acknowledges the problem, but indirectly, and leaves the false record in place." },
          ],
        },
      ],
    },
    {
      slug: "pressure-and-teamwork",
      title: "Pressure, prioritisation and teamwork",
      summary: "Handling competing demands, conflict in the team and your own limits — the scenarios where several things are right and order matters.",
      minutes: 12,
      sections: [
        {
          heading: "Prioritising",
          blocks: [
            { kind: "list", ordered: true, items: [
              "Anything urgent that affects a patient's safety comes first.",
              "Then commitments with deadlines others depend on.",
              "Then your own learning and tasks that can move.",
            ] },
            { kind: "p", text: "When two commitments clash, the very appropriate answer usually involves telling the people affected early and honestly, rather than quietly dropping one." },
          ],
        },
        {
          heading: "Conflict in the team",
          blocks: [
            { kind: "p", text: "Start with a private conversation, listen to the other side, and look for a practical fix. Escalate when that fails or when there is a risk to patients. Avoid public confrontation, sides and gossip." },
          ],
        },
        {
          heading: "Your own wellbeing",
          blocks: [
            { kind: "p", text: "Looking after yourself is part of professional behaviour. Struggling students and doctors are expected to seek help — from a tutor, occupational health or their GP — not to hide it." },
            { kind: "tip", text: "'Wait and see' is rarely very appropriate when someone is struggling or a risk is present; 'act now, sensibly' usually is." },
          ],
        },
      ],
      terms: [
        { term: "Prioritisation", definition: "Ordering tasks by urgency and by who depends on them." },
        { term: "Occupational health", definition: "The service that supports staff and students' health at work." },
      ],
      examples: [
        {
          kind: "rating", id: "sjt-pt-e1",
          stimulus: [{ kind: "p", text: "Maya, a fourth-year medical student, promised to help a junior doctor audit patient notes this afternoon. She then learns that a mandatory teaching session has been moved to the same time." }],
          prompt: "How appropriate are each of the following responses by Maya?",
          scale: "appropriate",
          items: [
            { text: "Tell the junior doctor as soon as possible and offer another time for the audit.", answer: 0, why: "Early, honest and keeps her commitment as best she can." },
            { text: "Skip the mandatory teaching without telling anyone.", answer: 3, why: "Breaks a mandatory commitment and is not open about it." },
            { text: "Attend the teaching and email the junior doctor afterwards to apologise.", answer: 2, why: "The right choice of session, but leaving the doctor waiting without warning is poor teamwork." },
            { text: "Ask a fellow student whether they could help with the audit instead, then tell the junior doctor.", answer: 1, why: "Practical, but the doctor should be told first and may not want a substitute." },
          ],
        },
      ],
      practice: [
        {
          kind: "rating", id: "sjt-pt-p1",
          stimulus: [{ kind: "p", text: "Omar, a medical student, has been feeling overwhelmed for several weeks. He is sleeping badly and has fallen behind on coursework, but has not told anyone." }],
          prompt: "How appropriate are each of the following responses by Omar?",
          scale: "appropriate",
          items: [
            { text: "Make an appointment with his personal tutor to discuss how he is feeling.", answer: 0, why: "Seeks appropriate support early." },
            { text: "Keep going without telling anyone, hoping things improve after exams.", answer: 3, why: "Hiding it delays help and risks his health and studies." },
            { text: "Talk to a close friend about how he is feeling.", answer: 1, why: "A good start, but a friend cannot arrange the academic or medical support he may need." },
            { text: "Book an appointment with his GP.", answer: 0, why: "Appropriate help for possible health problems." },
          ],
        },
      ],
    },
  ],
};
