import type { Subtest } from "@/lib/ucat-lessons";

// Verbal Reasoning. Passages and questions are written for this site.

const TIDE = [
  { kind: "p" as const, text: "The Severn Estuary has one of the largest tidal ranges in the world: at spring tides the water at Avonmouth can rise and fall by more than 14 metres. For decades engineers have proposed a barrage across the estuary to turn this movement into electricity. Supporters claim a barrage could supply around five per cent of the United Kingdom's electricity demand." },
  { kind: "p" as const, text: "Every proposal so far has been rejected. A 2010 government review concluded that the cost, then estimated at £30 billion, could not be justified when compared with other low-carbon options. Conservation groups also objected, because the mudflats the barrage would flood are feeding grounds for tens of thousands of wading birds each winter." },
  { kind: "p" as const, text: "Smaller tidal lagoons, which enclose only part of a bay, have been suggested as a compromise. A lagoon planned for Swansea Bay received planning permission in 2015, but the government declined to fund it in 2018, saying its electricity would be too expensive." },
];

const LIBRARY = [
  { kind: "p" as const, text: "When the town library reopened after its refurbishment, visitor numbers rose sharply. In the first six months, the average number of visitors per day was 410, compared with 260 in the same months of the previous year. The library had also extended its opening hours on weekdays, closing at 8 p.m. instead of 6 p.m." },
  { kind: "p" as const, text: "The council has argued that the new children's area was the main reason for the rise. However, staff surveys suggest that many of the new evening visitors were students using the quiet study room, which was unchanged by the refurbishment. Some regular visitors complained that the café, added during the work, made the ground floor noisier." },
];

export const VR: Subtest = {
  key: "vr",
  name: "Verbal Reasoning",
  intro: "Reading a passage quickly and deciding what follows from it — and what does not. Eleven passages of 200–400 words, four questions each, about 30 seconds a question. The skill is not reading everything: it is finding the one or two sentences each question depends on and judging them strictly.",
  questions: 44,
  minutes: 22,
  lessons: [
    {
      slug: "how-it-works",
      title: "How Verbal Reasoning works",
      summary: "The format, the timing, and the one rule every answer depends on: only what logically follows from the passage.",
      minutes: 10,
      sections: [
        {
          heading: "The format",
          blocks: [
            { kind: "p", text: "The subtest has 44 questions on 11 passages — four questions per passage. You have 22 minutes, which leaves roughly two minutes a passage, or about 30 seconds a question. Most candidates do not finish on their first timed attempt; time is the real opponent." },
            { kind: "p", text: "Questions come in two shapes. True / False / Can't Tell questions give you a statement and three fixed answers. Free-text questions give you a question or an unfinished sentence and four options to choose from. Recent papers lean heavily towards free-text — often around two-thirds of the passages." },
            { kind: "table", head: ["", "True / False / Can't Tell", "Free text"], rows: [
              ["Item", "A complete statement", "A question or incomplete statement"],
              ["Options", "Always the same three", "Four, written for the question"],
              ["Pace", "Faster", "Slower — budget more time"],
            ] },
          ],
        },
        {
          heading: "Logically follows",
          blocks: [
            { kind: "p", text: "Every answer is judged on one thing: does it follow from the passage alone, with no assumptions and no outside knowledge? A statement can be true in the real world and still be 'Can't Tell' in the exam." },
            { kind: "p", text: "Simple arithmetic and direct inference count as following. If a passage says a shelf holds three red books and two blue books and nothing else, 'the shelf holds five books' is True even though the number five never appears. Remove 'and nothing else' and the same statement becomes Can't Tell — there might be other books." },
            { kind: "tip", text: "Ask of every statement: could the passage be completely accurate and this statement still be false? If yes, it does not logically follow." },
          ],
        },
        {
          heading: "The core strategy: question first, passage second",
          blocks: [
            { kind: "p", text: "There is no time to read each passage carefully and then answer. Go straight to the first question instead, and use the passage as a reference you search, not a story you read." },
            { kind: "list", ordered: true, items: [
              "Read the statement or question.",
              "Pick out its key words — names, numbers, unusual terms.",
              "Scan the passage for those words (or obvious synonyms).",
              "Read the sentence that contains them, plus the sentences either side.",
              "Keep scanning: the key word may appear again further on, with information that changes the answer.",
              "Decide from that targeted reading, and move on.",
            ] },
            { kind: "p", text: "Repeat for every question. After two or three questions on the same passage you will usually know where things are, and later questions get faster." },
          ],
        },
        {
          heading: "No negative marking",
          blocks: [
            { kind: "p", text: "A wrong answer costs nothing; a blank is a certain zero. Never leave a question unanswered. If a question is eating time, pick your best option, flag it, and come back only if time remains." },
          ],
        },
      ],
      terms: [
        { term: "Passage", definition: "The 200–400 word text that a set of four questions is based on." },
        { term: "Item", definition: "A single question or statement attached to a passage." },
        { term: "Logically follows", definition: "Must be true if the passage is true, with no assumptions or outside knowledge added." },
        { term: "Key word", definition: "A distinctive word or number in the question that you search the passage for." },
        { term: "Targeted reading", definition: "Reading only the sentences around the key words, rather than the whole passage." },
        { term: "Flag", definition: "Marking a question to revisit at the end of the subtest if time allows." },
      ],
      examples: [
        {
          kind: "mcq", id: "vr-hw-e1", stimulus: TIDE,
          prompt: "Statement: A barrage across the Severn Estuary would supply about five per cent of the UK's electricity.",
          options: ["True", "False", "Can't Tell"], answer: 2,
          explanation: "The key words lead to the end of the first paragraph: 'Supporters claim a barrage could supply around five per cent'. A claim by supporters is not a fact, and 'could' is a possibility. The passage never says it would. Can't Tell.",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "vr-hw-p1", stimulus: TIDE,
          prompt: "Statement: The Swansea Bay lagoon was never built because it failed to get planning permission.",
          options: ["True", "False", "Can't Tell"], answer: 1,
          explanation: "The lagoon 'received planning permission in 2015'. The stated reason it did not go ahead is that the government declined to fund it. The statement contradicts the passage: False.",
        },
        {
          kind: "mcq", id: "vr-hw-p2", stimulus: TIDE,
          prompt: "Statement: At Avonmouth the water level never changes by more than 14 metres.",
          options: ["True", "False", "Can't Tell"], answer: 1,
          explanation: "The passage says the water can rise and fall by more than 14 metres at spring tides. 'Never more than 14 metres' is directly contradicted: False.",
        },
        {
          kind: "mcq", id: "vr-hw-p3", stimulus: TIDE,
          prompt: "Statement: The 2010 review found that other low-carbon options would be cheaper than a barrage.",
          options: ["True", "False", "Can't Tell"], answer: 2,
          explanation: "The review concluded the cost 'could not be justified when compared with other low-carbon options'. That suggests the alternatives looked better value, but it does not state they were cheaper — they might have been preferred for output or speed. Reading 'cheaper' into it is an assumption: Can't Tell.",
        },
      ],
    },
    {
      slug: "true-false-cant-tell",
      title: "True, False or Can't Tell — and clue words",
      summary: "Exactly what each answer means, and how definitive and mitigating words signal which one the writer intended.",
      minutes: 12,
      sections: [
        {
          heading: "The three answers, precisely",
          blocks: [
            { kind: "list", items: [
              "True — the passage makes the statement certain.",
              "False — the passage makes the statement impossible.",
              "Can't Tell — the passage leaves it open: it could be either.",
            ] },
            { kind: "p", text: "The most common error is choosing False when the passage simply does not mention something. Silence is not contradiction. False needs the passage to rule the statement out; if it does not address it at all, the answer is Can't Tell." },
          ],
        },
        {
          heading: "Clue words",
          blocks: [
            { kind: "p", text: "Question writers have to make each statement land on exactly one answer, and the words they use to do it are revealing. Two families matter most." },
            { kind: "table", head: ["Definitive words — close things down", "Mitigating words — open things up"], rows: [
              ["always, never, only, solely, must", "may, might, could, can"],
              ["cannot, impossible, certainly", "often, sometimes, usually, frequently"],
              ["exclusively, all, none", "likely, rarely, some, many"],
            ] },
            { kind: "p", text: "Compare the strength of the statement with the strength of the passage." },
            { kind: "list", items: [
              "Statement definitive, passage mitigated (or the reverse) → usually False or Can't Tell. 'The museum never opens on Mondays' against 'the museum usually closes on Mondays' is Can't Tell — usually leaves room for exceptions.",
              "Both at the same strength → usually True or False. 'Only members may vote' against 'voting is restricted to members' is True.",
            ] },
            { kind: "tip", text: "When you spot a clue word, ask why the writer put it there. It is rarely decoration — it is often the whole question." },
          ],
        },
        {
          heading: "Reported speech is a mitigation",
          blocks: [
            { kind: "p", text: "'Critics say', 'supporters claim', 'it has been suggested', 'some experts believe' — all of these tell you what was said, not what is true. A statement presenting a reported claim as fact is almost always Can't Tell." },
          ],
        },
      ],
      terms: [
        { term: "Definitive word", definition: "A word that makes a statement absolute — always, never, only, must." },
        { term: "Mitigating word", definition: "A word that softens a statement into a possibility or tendency — may, often, usually, some." },
        { term: "Can't Tell", definition: "The passage neither confirms nor rules out the statement." },
        { term: "Silence", definition: "The passage does not address the point at all — this gives Can't Tell, never False." },
        { term: "Reported claim", definition: "Something attributed to a person or group ('critics argue…') rather than stated as fact." },
      ],
      examples: [
        {
          kind: "mcq", id: "vr-tf-e1", stimulus: LIBRARY,
          prompt: "Statement: Every weekday the library now stays open two hours later than before.",
          options: ["True", "False", "Can't Tell"], answer: 0,
          explanation: "The library extended weekday opening, 'closing at 8 p.m. instead of 6 p.m.' — two hours later. The statement matches the passage at the same strength: True.",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "vr-tf-p1", stimulus: LIBRARY,
          prompt: "Statement: The new children's area was the main reason visitor numbers rose.",
          options: ["True", "False", "Can't Tell"], answer: 2,
          explanation: "This is the council's argument, not an established fact, and staff surveys point to another cause. The passage reports a claim and a counter-suggestion without settling it: Can't Tell.",
        },
        {
          kind: "mcq", id: "vr-tf-p2", stimulus: LIBRARY,
          prompt: "Statement: The quiet study room was refurbished along with the rest of the library.",
          options: ["True", "False", "Can't Tell"], answer: 1,
          explanation: "The study room 'was unchanged by the refurbishment'. The statement is ruled out: False.",
        },
        {
          kind: "mcq", id: "vr-tf-p3", stimulus: LIBRARY,
          prompt: "Statement: All regular visitors disliked the new café.",
          options: ["True", "False", "Can't Tell"], answer: 2,
          explanation: "'Some regular visitors complained' — a mitigated statement. 'All' is definitive. We do not know how the other regulars felt, so it is not ruled out either: Can't Tell.",
        },
        {
          kind: "mcq", id: "vr-tf-p4", stimulus: LIBRARY,
          prompt: "Statement: The library received more visitors per day in the six months after reopening than in the same period a year earlier.",
          options: ["True", "False", "Can't Tell"], answer: 0,
          explanation: "The average rose from 260 to 410 visitors per day for the same months. A higher daily average over the same period means more visitors per day: True.",
        },
      ],
    },
    {
      slug: "common-traps",
      title: "The eight common traps",
      summary: "The tricks question writers use again and again, and how to see through each one.",
      minutes: 15,
      sections: [
        {
          heading: "1. Scattered key words",
          blocks: [
            { kind: "p", text: "The information you need may be split across the passage — a name in the first paragraph, what that person did in the last. Never stop at the first mention of a key word; scan to the end." },
          ],
        },
        {
          heading: "2. Mitigation and contradiction nearby",
          blocks: [
            { kind: "p", text: "A sentence may seem to settle the question, only for the next one to qualify it ('…although this was later disputed'). Always read the sentences either side of your key word." },
          ],
        },
        {
          heading: "3. Faulty logic and causation",
          blocks: [
            { kind: "p", text: "If A implies B, B does not imply A: all surgeons are doctors, but not all doctors are surgeons. And two things happening together is not one causing the other. People who carry umbrellas get wet more often — umbrellas do not cause rain." },
            { kind: "tip", text: "Treat any statement about causes — 'because', 'led to', 'as a result' — with suspicion. The passage must state the link explicitly." },
          ],
        },
        {
          heading: "4. Outside knowledge",
          blocks: [
            { kind: "p", text: "Writers deliberately include facts you know to be true but that the passage does not state. If the passage never says Paris is in France, then 'the conference was held in France' is Can't Tell, however obvious it feels." },
          ],
        },
        {
          heading: "5. Juxtaposition",
          blocks: [
            { kind: "p", text: "Two sentences placed side by side invite you to link them. A quotation printed straight after a mention of an organisation is not necessarily that organisation's quotation. Look for a bridging phrase — 'because', 'due to', 'as a result of', 'according to' — before accepting a link." },
          ],
        },
        {
          heading: "6. Synonyms",
          blocks: [
            { kind: "p", text: "The passage may use different words from the statement: 'unprecedented' for 'had never happened before', 'halved' for 'fell by 50 per cent'. If the exact key word is missing, look for its meaning." },
          ],
        },
        {
          heading: "7. Sounds like Can't Tell",
          blocks: [
            { kind: "p", text: "Statements with subjective words — 'well', 'successful', 'popular' — tempt a quick Can't Tell. But the passage may give enough to judge. If someone 'answered fluently and in detail, in a hearing conducted entirely in Spanish', it is True that they speak Spanish well." },
          ],
        },
        {
          heading: "8. Numbers and averages",
          blocks: [
            { kind: "p", text: "Quick arithmetic is a form of inference, so expect to add and subtract. Watch averages in particular: an average of 170 cm does not prove anyone is taller or shorter than 170 cm — everyone could be exactly 170 cm. Read comparison words precisely too: if you can work out a figure is exactly 26, then 'at least 26' and 'no more than 26' are True, while 'more than 26' and 'fewer than 26' are False." },
          ],
        },
      ],
      terms: [
        { term: "Dispersion", definition: "Key information spread across different parts of the passage." },
        { term: "Correlation", definition: "Two things occurring together, which does not show that one causes the other." },
        { term: "Causation", definition: "One thing directly bringing about another — must be stated, never assumed." },
        { term: "Juxtaposition", definition: "Placing two ideas next to each other so they seem linked when the passage never links them." },
        { term: "Bridging phrase", definition: "Wording that explicitly connects two facts: because, due to, as a result of, according to." },
        { term: "Red herring", definition: "Information placed to lead you to a wrong answer, often superseded later in the passage." },
      ],
      examples: [
        {
          kind: "mcq", id: "vr-ct-e1",
          stimulus: [
            { kind: "p", text: "Marta Ilić joined the orchestra as a violinist in 2004. The orchestra's principal conductor since 2011, Tomas Berg, has led it on four international tours. In 2019 the orchestra recorded Dvořák's ninth symphony, a recording later described by one critic as 'the finest of its generation'. Ilić was appointed leader of the orchestra in 2016." },
          ],
          prompt: "Statement: The orchestra's leader played on the 2019 Dvořák recording.",
          options: ["True", "False", "Can't Tell"], answer: 2,
          explanation: "Scattered key words: Ilić is leader from 2016, so she was leader in 2019. But the passage never says who played on the recording — a leader can miss a recording. The statement requires an assumption: Can't Tell.",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "vr-ct-p1",
          stimulus: [
            { kind: "p", text: "A survey of 2,000 office workers found that those who took a lunch break away from their desk reported higher job satisfaction than those who ate at their desk. The researchers noted that workers who left their desks were also more likely to be in senior roles." },
          ],
          prompt: "Statement: Taking a lunch break away from the desk increases job satisfaction.",
          options: ["True", "False", "Can't Tell"], answer: 2,
          explanation: "A correlation, not a cause — and the passage itself raises another explanation (seniority). Nothing states that the break causes the satisfaction: Can't Tell.",
        },
        {
          kind: "mcq", id: "vr-ct-p2",
          stimulus: [
            { kind: "p", text: "The bridge took four years to build. Construction was delayed by a strike in its second year. Its total cost was £84 million, £12 million more than the original budget." },
          ],
          prompt: "Statement: The strike caused the bridge to go over budget.",
          options: ["True", "False", "Can't Tell"], answer: 2,
          explanation: "Juxtaposition: the delay and the overspend are mentioned together, but no bridging phrase links them. The overspend could have had other causes: Can't Tell.",
        },
        {
          kind: "mcq", id: "vr-ct-p3",
          stimulus: [
            { kind: "p", text: "The bridge took four years to build. Construction was delayed by a strike in its second year. Its total cost was £84 million, £12 million more than the original budget." },
          ],
          prompt: "Statement: The original budget for the bridge was £72 million.",
          options: ["True", "False", "Can't Tell"], answer: 0,
          explanation: "£84 million was £12 million over budget, so the budget was £84m − £12m = £72m. Arithmetic is logical inference: True.",
        },
        {
          kind: "mcq", id: "vr-ct-p4",
          stimulus: [
            { kind: "p", text: "In the regional chess league, the average age of the twelve club captains is 41." },
          ],
          prompt: "Statement: At least one captain is older than 41.",
          options: ["True", "False", "Can't Tell"], answer: 2,
          explanation: "An average of 41 is consistent with every captain being exactly 41. Nothing rules that out, so we cannot confirm anyone is older: Can't Tell.",
        },
      ],
    },
    {
      slug: "free-text",
      title: "Free-text questions",
      summary: "The question types behind the four options — incomplete statements, inference, strengthen/weaken, cause and consequence — and a method for each.",
      minutes: 14,
      sections: [
        {
          heading: "The method",
          blocks: [
            { kind: "list", ordered: true, items: [
              "Find the key words in the question and locate them in the passage.",
              "Read around them to get the passage's position on that point.",
              "Go through the options one by one, checking each against that part of the passage.",
              "Strike out options that fail. If one fits perfectly, take it and move on; if none is perfect, choose the best.",
            ] },
            { kind: "tip", text: "Each option is a mini True / False / Can't Tell. The right option is the one that is True; the others are False or Can't Tell." },
          ],
        },
        {
          heading: "Incomplete statements",
          blocks: [
            { kind: "p", text: "'The barrage was rejected because…' — join each ending onto the stem and test the whole sentence. Only an ending that makes a True sentence is correct. Be strict about 'because': the passage must give that reason." },
          ],
        },
        {
          heading: "Which is true / most likely / can be concluded",
          blocks: [
            { kind: "p", text: "'Which of the following can be concluded?' means 'which of these is True?' Apply the same standard as always. 'Most likely to be true' allows a value judgement — pick the option the passage best supports, even if it falls short of certain." },
          ],
        },
        {
          heading: "Strengthen and weaken",
          blocks: [
            { kind: "p", text: "Find the argument's conclusion and the premises holding it up. An option strengthens the argument if it supports a premise or adds a new one; it weakens it if it undermines a premise the conclusion depends on." },
            { kind: "p", text: "If a question asks which measure was most effective, look for measurable results against a stated goal." },
          ],
        },
        {
          heading: "Cause and consequence",
          blocks: [
            { kind: "p", text: "A cause is what directly brings something about; a consequence is what directly results. Both need an explicit link in the passage. Options that are merely mentioned near the topic are traps." },
          ],
        },
      ],
      terms: [
        { term: "Incomplete statement", definition: "A question stem you finish with one of the options; the finished sentence must be True." },
        { term: "Inference", definition: "A conclusion the passage makes certain, even if it is not stated word for word." },
        { term: "Value judgement", definition: "A question asking for the best-supported or most likely option, not just a certain one." },
        { term: "Premise", definition: "A reason given in support of a conclusion." },
        { term: "Strengthen / weaken", definition: "Adding to, or undermining, the premises an argument relies on." },
      ],
      examples: [
        {
          kind: "mcq", id: "vr-ft-e1", stimulus: TIDE,
          prompt: "The Swansea Bay lagoon did not go ahead because",
          options: [
            "conservation groups objected to it.",
            "it failed to receive planning permission.",
            "the government judged its electricity too expensive.",
            "it would have flooded feeding grounds for wading birds.",
          ], answer: 2,
          explanation: "The passage says the government declined to fund it, 'saying its electricity would be too expensive'. A and D describe objections to the full barrage, not the lagoon; B is false — it received permission.",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "vr-ft-p1", stimulus: TIDE,
          prompt: "Which of the following can be concluded from the passage?",
          options: [
            "A Severn barrage will never be built.",
            "Tidal lagoons have smaller environmental effects than barrages.",
            "No proposal for a Severn barrage has yet been approved.",
            "The Severn Estuary has the largest tidal range in the world.",
          ], answer: 2,
          explanation: "'Every proposal so far has been rejected' makes C certain. A predicts the future; B is not stated (a lagoon encloses less, but its effects are not compared); D overstates 'one of the largest'.",
        },
        {
          kind: "mcq", id: "vr-ft-p2", stimulus: LIBRARY,
          prompt: "Which of the following, if true, would most weaken the council's argument about the rise in visitors?",
          options: [
            "Most of the extra visitors came on weekday evenings and went straight to the study room.",
            "The children's area is the largest single space in the library.",
            "Several nearby libraries also added children's areas that year.",
            "Visitor numbers on Saturdays rose by a similar amount to weekdays.",
          ], answer: 0,
          explanation: "The council credits the children's area. If the extra visitors came in the new evening hours and used the unchanged study room, the rise is explained by something else, undermining the claim. D slightly supports the council (weekend hours did not change), B and C are irrelevant.",
        },
        {
          kind: "mcq", id: "vr-ft-p3", stimulus: LIBRARY,
          prompt: "According to the passage, a consequence of the refurbishment was that",
          options: [
            "the library began opening until 8 p.m.",
            "the ground floor became noisier for some visitors.",
            "students began using the quiet study room.",
            "visitor numbers rose by more than half.",
          ], answer: 1,
          explanation: "The café was 'added during the work' and some visitors complained it made the ground floor noisier — a direct link. The longer hours are not said to result from the refurbishment; the study room was unchanged; and while numbers did rise by more than half (260 → 410), the passage does not attribute that rise to the refurbishment.",
        },
      ],
    },
    {
      slug: "timing-and-guessing",
      title: "Timing, guessing and how to practise",
      summary: "Pacing a 22-minute subtest, when to guess, and a practice plan that actually raises scores.",
      minutes: 8,
      sections: [
        {
          heading: "Pacing",
          blocks: [
            { kind: "list", items: [
              "Two minutes per passage is the ceiling. Glance at the timer after each passage: after passage 3 you want about 15 minutes left, after passage 7 about 7 minutes.",
              "True / False / Can't Tell sets are quicker — bank time on them for the free-text sets.",
              "If a question is not yielding after 45 seconds, answer, flag and move on.",
            ] },
          ],
        },
        {
          heading: "Educated guessing",
          blocks: [
            { kind: "p", text: "Strike out what you can, then go with your instinct — it often reflects reading you have done without noticing. On True / False / Can't Tell, if you truly cannot decide, Can't Tell is a reasonable default for statements full of mitigating words; a definitive statement against a definitive passage is more often True or False." },
          ],
        },
        {
          heading: "Practising well",
          blocks: [
            { kind: "list", items: [
              "Always practise against the clock, on a screen.",
              "Train skimming: give yourself 20 seconds to find a named fact in a news article.",
              "Review every wrong answer and name the trap that caught you.",
              "Write a few questions of your own on a passage — it puts you in the examiner's mind.",
              "Finish with full timed sets on the official practice tests at practice.ucat.ac.uk.",
            ] },
          ],
        },
      ],
      terms: [
        { term: "Pacing check", definition: "A planned look at the timer after a set number of passages." },
        { term: "Educated guess", definition: "A guess made after eliminating options that cannot be right." },
      ],
      examples: [],
      practice: [
        {
          kind: "mcq", id: "vr-tg-p1",
          prompt: "You are 12 minutes into Verbal Reasoning and have just finished passage 5. What should you do?",
          options: [
            "Slow down — you are ahead of pace.",
            "Keep going at the same pace — you are on schedule.",
            "Speed up — you are behind and need to save about two minutes.",
            "Skip to the last passage and work backwards.",
          ], answer: 2,
          explanation: "At two minutes a passage, five passages should take about 10 minutes (plus the minute of reading time at the start). At 12 minutes you are roughly two minutes behind and need to tighten up — answer and flag anything slow.",
        },
        {
          kind: "mcq", id: "vr-tg-p2",
          prompt: "With 20 seconds left you have three questions unanswered. What is the best move?",
          options: [
            "Leave them blank to avoid penalties.",
            "Answer all three with your best guess.",
            "Read the first one carefully and answer that one only.",
            "Answer only the True / False / Can't Tell ones.",
          ], answer: 1,
          explanation: "There is no negative marking: a guess can only gain marks. Fill in all three.",
        },
      ],
    },
  ],
};
