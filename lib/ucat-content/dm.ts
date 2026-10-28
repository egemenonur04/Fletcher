import type { Subtest } from "@/lib/ucat-lessons";

// Decision Making. Every puzzle and argument is written for this site.

export const DM: Subtest = {
  key: "dm",
  name: "Decision Making",
  intro: "Logic and judgement on short, self-contained problems: weighing arguments, following rules through a puzzle, reading Venn diagrams and working out probabilities. Each question stands alone, so every one is a fresh set of information — about a minute each.",
  questions: 35,
  minutes: 37,
  lessons: [
    {
      slug: "how-it-works",
      title: "How Decision Making works",
      summary: "The question families, the drag-and-drop scoring, and how to spend about a minute per question.",
      minutes: 8,
      sections: [
        {
          heading: "The format",
          blocks: [
            { kind: "p", text: "35 questions in 37 minutes — just over a minute each. Unlike Verbal and Quantitative Reasoning there are no shared passages: every question brings its own text, table, chart or diagram. An on-screen calculator is available, and so is your notebook — use it for grids and diagrams." },
            { kind: "table", head: ["Family", "Question types", "Roughly"], rows: [
              ["Evaluating arguments", "Strongest argument, assumptions, interpreting information and drawing conclusions", "a third"],
              ["Deductive reasoning", "Syllogisms, logic puzzles", "a third"],
              ["Statistical and figural reasoning", "Venn diagrams, probability, statistics", "a third"],
            ] },
          ],
        },
        {
          heading: "Two answer formats",
          blocks: [
            { kind: "p", text: "Most questions have four options and one answer. The rest are drag-and-drop: five statements, each to be marked Yes (it follows) or No (it does not)." },
            { kind: "table", head: ["Drag-and-drop statements right", "Marks"], rows: [["5 of 5", "2"], ["4 of 5", "1"], ["3 or fewer", "0"]] },
            { kind: "tip", text: "A drag-and-drop question is worth up to two marks but takes longer. Give it a little more time than a single-answer question — but if you are stuck on one statement, take your best guess: four out of five still scores." },
          ],
        },
        {
          heading: "Habits that help",
          blocks: [
            { kind: "list", items: [
              "Read the question before the information — know what you are looking for.",
              "Draw: a line of positions, a grid, a Venn diagram. It is faster than holding rules in your head.",
              "Never use outside knowledge, and in 'Yes / No' questions be strict: Yes only if it must follow.",
              "Flag anything over 90 seconds and come back.",
            ] },
          ],
        },
      ],
      terms: [
        { term: "Drag-and-drop", definition: "A question with five statements, each marked Yes or No; scored 2, 1 or 0." },
        { term: "Standalone question", definition: "A question with its own information, unrelated to the questions around it." },
        { term: "Notebook", definition: "The wipe-clean booklet given at the test centre for working." },
      ],
      examples: [],
      practice: [
        {
          kind: "mcq", id: "dm-hw-p1",
          prompt: "On a drag-and-drop question you are sure of four statements and unsure of the fifth. How many marks do you secure by answering the four correctly and guessing the fifth?",
          options: ["0", "At least 1", "Exactly 2", "At least 4"], answer: 1,
          explanation: "Four correct is worth 1 mark whatever happens to the fifth; if the guess is right you get 2. So at least 1.",
        },
      ],
    },
    {
      slug: "arguments",
      title: "The strongest argument",
      summary: "What makes an argument strong or weak, and a quick test for picking the best of four.",
      minutes: 12,
      sections: [
        {
          heading: "Premises and conclusions",
          blocks: [
            { kind: "p", text: "An argument is a conclusion held up by premises — the reasons given for it. Picture a roof on pillars: the more solid pillars there are, the steadier the roof. An assumption is a hidden pillar — a premise the argument needs but never states. Every assumption makes the argument shakier." },
          ],
        },
        {
          heading: "What makes an argument strong",
          blocks: [
            { kind: "list", items: [
              "It answers the question actually asked — directly relevant, not about a neighbouring issue.",
              "It is objective, not an opinion or a feeling.",
              "It rests on evidence, ideally specific: a study, a figure, a comparison.",
              "It does not overreach — 'many' or 'some' is honest, 'everyone' rarely is.",
            ] },
            { kind: "p", text: "Strongest-argument questions usually offer two 'Yes' and two 'No' options. The side does not matter; only the quality of the reasoning does." },
          ],
        },
        {
          heading: "What makes an argument weak",
          blocks: [
            { kind: "list", items: [
              "A vague or missing link to the question (talking about snacks when the question is about fruit and vegetables).",
              "Subjective words: 'better', 'annoying', 'nicer', 'people like'.",
              "Hidden assumptions you would have to add to make it work.",
              "Covering only part of the proposal (fruit, when the question asks about fruit and vegetables).",
            ] },
          ],
        },
      ],
      terms: [
        { term: "Argument", definition: "A conclusion supported by one or more reasons." },
        { term: "Premise", definition: "A reason offered in support of the conclusion." },
        { term: "Assumption", definition: "An unstated premise the argument depends on." },
        { term: "Relevance", definition: "How directly a reason addresses the specific question asked." },
      ],
      examples: [
        {
          kind: "mcq", id: "dm-ar-e1",
          stimulus: [{ kind: "p", text: "Should secondary schools ban pupils from using mobile phones during the school day?" }],
          prompt: "Select the strongest argument.",
          options: [
            "Yes — phones are a distraction and everyone knows teenagers spend too long on them.",
            "Yes — a study of 90 schools found exam results improved after phone bans, most of all for the lowest-achieving pupils.",
            "No — many parents like being able to contact their children at any time.",
            "No — smartphones are expensive, and banning them will not make them cheaper.",
          ], answer: 1,
          explanation: "B is relevant, specific and evidence-based. A rests on an appeal to 'everyone knows'; C is about what parents like, not pupils' schooling; D is irrelevant to whether phones should be used in school.",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "dm-ar-p1",
          stimulus: [{ kind: "p", text: "Should the town replace the parking spaces on its high street with a two-way cycle lane?" }],
          prompt: "Select the strongest argument.",
          options: [
            "Yes — cycling is good for people's health.",
            "Yes — a cycle lane would make the high street look more modern.",
            "No — a survey found 60% of high-street shoppers arrive by car, and footfall fell by 15% in a similar town after the same change.",
            "No — some drivers will be annoyed at losing the spaces.",
          ], answer: 2,
          explanation: "C uses specific evidence that bears directly on the effect of this change. A is true but general — it does not show this lane would increase cycling. B and D are subjective.",
        },
        {
          kind: "mcq", id: "dm-ar-p2",
          stimulus: [{ kind: "p", text: "Should the hospital introduce a four-day working week for its administrative staff?" }],
          prompt: "Select the strongest argument.",
          options: [
            "Yes — a year-long trial in the hospital's finance department found sick days fell by a third with no drop in work completed.",
            "Yes — staff would be happier with an extra day off.",
            "No — patients need care seven days a week.",
            "No — it is unfair that clinical staff would not get the same arrangement.",
          ], answer: 0,
          explanation: "A is specific, measured and from the same setting. B is an assumption about feelings. C confuses administrative with clinical staff. D is a value judgement about fairness rather than evidence about the policy's effects.",
        },
      ],
    },
    {
      slug: "assumptions-and-conclusions",
      title: "Assumptions and drawing conclusions",
      summary: "Spotting what an argument takes for granted, and deciding which conclusions really follow from text or data.",
      minutes: 12,
      sections: [
        {
          heading: "Finding the assumption",
          blocks: [
            { kind: "p", text: "An assumption bridges the gap between the premises and the conclusion. To find it, ask: what would have to be true for this conclusion to follow? Then test each option by negating it — if the argument collapses when the option is false, that option is an assumption it relies on." },
          ],
        },
        {
          heading: "Drawing conclusions",
          blocks: [
            { kind: "p", text: "A valid conclusion follows logically from the information — exactly the 'True' standard from Verbal Reasoning. With data, compare like with like: proportions with proportions, not raw counts with percentages. In drag-and-drop versions, mark each statement Yes only if it must be true." },
            { kind: "tip", text: "Watch for statements that are probably true, or true in the real world, but not guaranteed by the information. They are No." },
          ],
        },
      ],
      terms: [
        { term: "Negation test", definition: "Imagine the option is false: if the argument breaks, the option is an assumption it needs." },
        { term: "Valid conclusion", definition: "One that must be true given the information." },
        { term: "Proportion", definition: "A part compared with its whole (late trains out of trains run), used to compare groups of different sizes." },
      ],
      examples: [
        {
          kind: "yesno", id: "dm-ac-e1",
          stimulus: [{ kind: "p", text: "Every member of the chess club plays at least one tournament a year. Priya played no tournaments last year. Ben played three tournaments last year." }],
          prompt: "Place 'Yes' if the conclusion follows and 'No' if it does not.",
          statements: [
            { text: "Priya was not a member of the chess club for all of last year.", answer: true, why: "A member plays at least one tournament a year; Priya played none, so she cannot have been a member for the whole year." },
            { text: "Ben is a member of the chess club.", answer: false, why: "Non-members may play tournaments too. Playing three does not prove membership." },
            { text: "Ben played more tournaments than Priya last year.", answer: true, why: "Three is more than none." },
            { text: "Some club members played only one tournament last year.", answer: false, why: "We only know members play at least one; how many each played is unknown." },
            { text: "If Priya joins the club, she will play at least one tournament a year.", answer: true, why: "As a member, the rule 'every member plays at least one tournament a year' applies to her." },
          ],
        },
      ],
      practice: [
        {
          kind: "mcq", id: "dm-ac-p1",
          stimulus: [{ kind: "p", text: "Sales at the café fell after it raised its prices in March. So if the café lowers its prices again, sales will recover." }],
          prompt: "Which assumption does this argument depend on?",
          options: [
            "The price rise was the cause of the fall in sales.",
            "Customers generally prefer cheaper cafés.",
            "The café's own costs will stay the same.",
            "Other cafés nearby also raised their prices.",
          ], answer: 0,
          explanation: "The argument only works if the price rise caused the fall. Negate A — if the fall was due to, say, roadworks outside — and lowering prices need not bring sales back. B is broader than needed; C and D are not required for the conclusion.",
        },
        {
          kind: "mcq", id: "dm-ac-p2",
          stimulus: [
            { kind: "p", text: "A rail operator recorded how many of its trains ran late." },
            { kind: "table", head: ["Month", "Trains run", "Trains late"], rows: [["January", "400", "60"], ["February", "380", "76"], ["March", "420", "42"]] },
          ],
          prompt: "Which conclusion is supported by the data?",
          options: [
            "February had the highest proportion of late trains.",
            "More trains ran in February than in January.",
            "The proportion of late trains fell every month.",
            "March had the most late trains.",
          ], answer: 0,
          explanation: "Proportions late: January 60/400 = 15%, February 76/380 = 20%, March 42/420 = 10%. February is highest. B is false (380 < 400), C is false (it rose in February), D is false (February had 76).",
        },
      ],
    },
    {
      slug: "syllogisms",
      title: "Syllogisms",
      summary: "Reasoning with all, some and none — the patterns that follow, the ones that only look as if they do, and drawing them as circles.",
      minutes: 14,
      sections: [
        {
          heading: "What a syllogism is",
          blocks: [
            { kind: "p", text: "A conclusion reached from two or more premises that share a term: all surgeons are doctors; all doctors are graduates; so all surgeons are graduates. Replace the words with letters to see the structure: all A are B, all B are C, so all A are C." },
          ],
        },
        {
          heading: "What follows — and what does not",
          blocks: [
            { kind: "table", head: ["Premises", "Follows", "Does NOT follow"], rows: [
              ["All A are B", "Some B are A (if any A exist)", "All B are A"],
              ["Some A are B", "Some B are A", "Some A are not B"],
              ["No A are B", "No B are A", "—"],
              ["All A are B; all B are C", "All A are C", "All C are A"],
              ["All A are B; some C are A", "Some C are B", "All C are B"],
              ["All A are B; some C are B", "Nothing about C and A", "Some C are A"],
              ["All A are B; no B are C", "No A are C", "—"],
            ] },
            { kind: "tip", text: "'Some' means at least one — possibly all. So 'some A are B' never tells you that some A are not B." },
          ],
        },
        {
          heading: "Draw it",
          blocks: [
            { kind: "p", text: "Sketch each group as a circle. 'All A are B' puts A inside B. 'No A are B' keeps them apart. 'Some A are B' makes them overlap. Then for each statement ask: is there any way to draw the premises where this is false? If there is, the answer is No." },
          ],
        },
      ],
      terms: [
        { term: "Syllogism", definition: "A conclusion drawn from premises that share a common term." },
        { term: "Some", definition: "At least one, and possibly all." },
        { term: "Converse", definition: "Swapping the terms (all A are B → all B are A) — not valid for 'all'." },
        { term: "Contrapositive", definition: "From 'all A are B': anything that is not B is not A. Always valid." },
      ],
      examples: [
        {
          kind: "yesno", id: "dm-sy-e1",
          stimulus: [{ kind: "p", text: "All the violinists in the orchestra can read music. Some members of the orchestra are violinists. No one who can read music finds the conductor's notes confusing." }],
          prompt: "Place 'Yes' if the conclusion follows and 'No' if it does not.",
          statements: [
            { text: "Some orchestra members can read music.", answer: true, why: "Some members are violinists, and all the violinists can read music." },
            { text: "All orchestra members can read music.", answer: false, why: "Only the violinists are known to read music." },
            { text: "No violinist in the orchestra finds the conductor's notes confusing.", answer: true, why: "Violinists read music, and no one who reads music finds the notes confusing." },
            { text: "Everyone who can read music is a violinist.", answer: false, why: "The converse of 'all violinists read music' does not follow." },
            { text: "Some orchestra members find the conductor's notes confusing.", answer: false, why: "Non-violinists might or might not; nothing makes it certain." },
          ],
        },
      ],
      practice: [
        {
          kind: "yesno", id: "dm-sy-p1",
          stimulus: [{ kind: "p", text: "All of the cafés on Mill Street sell oat milk. Some cafés that sell oat milk also sell vegan cake. No café on Mill Street opens before 8 a.m." }],
          prompt: "Place 'Yes' if the conclusion follows and 'No' if it does not.",
          statements: [
            { text: "Some cafés on Mill Street sell vegan cake.", answer: false, why: "The oat-milk cafés selling vegan cake may all be elsewhere." },
            { text: "A café that opens at 7 a.m. is not on Mill Street.", answer: true, why: "No Mill Street café opens before 8 a.m." },
            { text: "Every café that sells oat milk is on Mill Street.", answer: false, why: "The converse of 'all Mill Street cafés sell oat milk'." },
            { text: "If a café does not sell oat milk, it is not on Mill Street.", answer: true, why: "The contrapositive of 'all Mill Street cafés sell oat milk'." },
            { text: "Some cafés that open before 8 a.m. sell oat milk.", answer: false, why: "Nothing is said about early-opening cafés elsewhere." },
          ],
        },
        {
          kind: "mcq", id: "dm-sy-p2",
          stimulus: [{ kind: "p", text: "No reptiles in the zoo are mammals. All the animals in the night house are reptiles." }],
          prompt: "Which conclusion must be true?",
          options: [
            "Some mammals live in the night house.",
            "No animal in the night house is a mammal.",
            "All reptiles in the zoo live in the night house.",
            "Some reptiles in the zoo are not in the night house.",
          ], answer: 1,
          explanation: "Night-house animals are all reptiles, and no reptile is a mammal, so none is a mammal (all A are B; no B are C → no A are C). C is the converse; D is possible but not certain.",
        },
      ],
    },
    {
      slug: "logic-puzzles",
      title: "Logic puzzles",
      summary: "Single-parameter ordering puzzles, multi-parameter grids and symbol equations — and the drawings that make them quick.",
      minutes: 15,
      sections: [
        {
          heading: "Single-parameter puzzles",
          blocks: [
            { kind: "p", text: "One thing varies — position in a queue, weight, finishing order. Write the slots in a line and place people as each rule allows. Start with the most restrictive rule (a fixed position, a 'last', an 'immediately after')." },
          ],
        },
        {
          heading: "Multi-parameter puzzles",
          blocks: [
            { kind: "list", ordered: true, items: [
              "Draw a grid: one column per parameter (person, pet, house…), one row per item.",
              "Apply each rule in turn and record links and exclusions.",
              "After each rule, look for what it now forces — the deductions that follow from combining rules.",
              "Only then test the options.",
            ] },
          ],
        },
        {
          heading: "Visual and symbol puzzles",
          blocks: [
            { kind: "p", text: "Turn symbols into letters and pictures into equations. Solve the simplest equation first and substitute. For seating and layout puzzles, draw the table or the map." },
            { kind: "tip", text: "When a question asks what 'must' be true, an option that is merely possible is wrong. Check whether the puzzle has more than one solution." },
          ],
        },
      ],
      terms: [
        { term: "Parameter", definition: "A quantity or category that varies in a puzzle — position, colour, size." },
        { term: "Constraint", definition: "A rule that limits where something can go." },
        { term: "Deduction", definition: "A fact forced by combining constraints." },
      ],
      examples: [
        {
          kind: "mcq", id: "dm-lp-e1",
          stimulus: [{ kind: "p", text: "Five runners — Ana, Ben, Cal, Dev and Eli — finished a race with no ties. Ben finished before Cal but after Eli. Ana finished last. Dev finished immediately after Ben." }],
          prompt: "Who finished third?",
          options: ["Ben", "Cal", "Dev", "Eli"], answer: 2,
          explanation: "Ana is 5th. Eli is before Ben, Dev is straight after Ben, and Cal is after Ben. If Ben were 3rd, Dev would be 4th and Cal would need 5th — taken by Ana. So Ben is 2nd, Eli 1st, Dev 3rd, Cal 4th.",
        },
        {
          kind: "mcq", id: "dm-lp-e2",
          stimulus: [{ kind: "p", text: "Lena, Omar and Ruth each own one pet — a cat, a dog or a rabbit — and live at numbers 1, 2 and 3 on the same street. The dog's owner lives at number 1. Ruth lives next door to the dog's owner and does not own the rabbit. Omar lives at number 3." }],
          prompt: "Which of the following must be true?",
          options: ["Lena owns the cat.", "Ruth lives at number 2 and owns the cat.", "Omar owns the dog.", "The rabbit's owner lives at number 2."], answer: 1,
          explanation: "Omar is at 3, so the dog owner at 1 is Lena or Ruth. Ruth lives next door to the dog owner, so she is not the dog owner — Ruth is at 2 and Lena at 1 with the dog. Ruth does not own the rabbit, so she has the cat; Omar has the rabbit.",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "dm-lp-p1",
          stimulus: [{ kind: "p", text: "In the puzzle below each symbol stands for a number. ★ + ★ = ▲. ▲ + ★ = 12." }],
          prompt: "What is ▲ + ▲?",
          options: ["8", "12", "16", "24"], answer: 2,
          explanation: "▲ = 2★, so 2★ + ★ = 3★ = 12, giving ★ = 4 and ▲ = 8. ▲ + ▲ = 16.",
        },
        {
          kind: "mcq", id: "dm-lp-p2",
          stimulus: [{ kind: "p", text: "Four books stand on a shelf: an Atlas, a Biography, a Cookbook and a Diary. The Cookbook is immediately to the right of the Atlas. The Diary is at one end of the shelf. The Biography is not next to the Diary." }],
          prompt: "Which of the following must be true?",
          options: ["The Atlas is second from the left.", "The Diary is on the far left.", "The Biography is on the far right.", "The Cookbook is at one end."], answer: 0,
          explanation: "Two arrangements fit: Diary, Atlas, Cookbook, Biography and Biography, Atlas, Cookbook, Diary. In both the Atlas is second. B and C are each true in only one arrangement; D is never true.",
        },
        {
          kind: "mcq", id: "dm-lp-p3",
          stimulus: [{ kind: "p", text: "Three suitcases weighed 12, 15 and 21 kg on departure (in some order) and 14, 20 and 27 kg on return. Every suitcase was heavier on return. Mia's suitcase gained the most weight. Joe's suitcase was the lightest on return. Sam's suitcase weighed 15 kg on departure." }],
          prompt: "What did Mia's suitcase weigh on return?",
          options: ["14 kg", "20 kg", "27 kg", "Cannot be determined"], answer: 2,
          explanation: "Joe's was lightest on return (14 kg); every case got heavier, so Joe left with 12 kg. Sam left with 15 kg, so Mia left with 21 kg. Mia's must have come back at 27 kg (20 would be lighter than 21). Check: Sam 15 → 20 (+5), Mia 21 → 27 (+6), Joe 12 → 14 (+2) — Mia gained most, as stated.",
        },
      ],
    },
    {
      slug: "venn-diagrams",
      title: "Venn diagrams",
      summary: "Filling two- and three-set diagrams from the centre outwards, and reading unusual layouts.",
      minutes: 12,
      sections: [
        {
          heading: "Fill from the centre",
          blocks: [
            { kind: "list", ordered: true, items: [
              "Put the number in all sets into the centre.",
              "Work out each 'two sets only' region: the pair total minus the centre.",
              "Work out each 'one set only' region: the set total minus everything already placed in it.",
              "Anyone left over from the overall total is outside every circle.",
            ] },
            { kind: "tip", text: "The classic slip is forgetting to subtract numbers already counted. 'Ten like tea and coffee, four of whom also like juice' means six in the tea-and-coffee-only region." },
          ],
        },
        {
          heading: "Two-set shortcut",
          blocks: [
            { kind: "p", text: "Total in either set = A + B − both. If you know how many are in neither, total = A + B − both + neither." },
          ],
        },
        {
          heading: "Unusual diagrams",
          blocks: [
            { kind: "p", text: "The exam sometimes uses triangles, rectangles and odd overlaps instead of circles. The rule is the same: a number belongs to every shape it sits inside. Read the question carefully — a detail in the wording (someone who was not surveyed, for example) can change the count." },
          ],
        },
      ],
      terms: [
        { term: "Intersection", definition: "The region in two or more sets at once." },
        { term: "Union", definition: "Everything in at least one of the sets." },
        { term: "Inclusion–exclusion", definition: "A ∪ B = A + B − (A ∩ B); for three sets, add the singles, subtract the pairs, add back the centre." },
      ],
      examples: [
        {
          kind: "mcq", id: "dm-vd-e1",
          stimulus: [{ kind: "p", text: "In a class of 30 students, 18 study Biology, 15 study Chemistry and 5 study neither." }],
          prompt: "How many students study both Biology and Chemistry?",
          options: ["3", "5", "8", "10"], answer: 2,
          explanation: "25 students study at least one (30 − 5). 18 + 15 − both = 25, so both = 8.",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "dm-vd-p1",
          stimulus: [{ kind: "p", text: "Of 50 people asked, 20 like tea, 25 like coffee and 15 like juice. 8 like tea and coffee, 5 like coffee and juice, and 4 like tea and juice. 2 like all three." }],
          prompt: "How many people like none of the three?",
          options: ["3", "5", "7", "10"], answer: 1,
          explanation: "At least one: 20 + 25 + 15 − 8 − 5 − 4 + 2 = 45. None: 50 − 45 = 5.",
        },
        {
          kind: "mcq", id: "dm-vd-p2",
          stimulus: [{ kind: "p", text: "Of 50 people asked, 20 like tea, 25 like coffee and 15 like juice. 8 like tea and coffee, 5 like coffee and juice, and 4 like tea and juice. 2 like all three." }],
          prompt: "How many people like tea only?",
          options: ["8", "10", "12", "14"], answer: 1,
          explanation: "Centre 2. Tea and coffee only: 8 − 2 = 6. Tea and juice only: 4 − 2 = 2. Tea only: 20 − 6 − 2 − 2 = 10.",
        },
      ],
    },
    {
      slug: "probability-and-statistics",
      title: "Probability and statistics",
      summary: "The handful of GCSE rules Decision Making uses — and, or, not, without replacement — plus mean, median and mode.",
      minutes: 14,
      sections: [
        {
          heading: "The rules you need",
          blocks: [
            { kind: "list", items: [
              "P(event) = ways it can happen ÷ all equally likely outcomes. Certain is 1, impossible is 0.",
              "Not: P(not A) = 1 − P(A). 'At least one' is usually easiest as 1 − P(none).",
              "And (independent events): multiply. A one then a six on a die: 1/6 × 1/6 = 1/36.",
              "Or (events that cannot both happen): add. A one or a six: 1/6 + 1/6 = 1/3.",
              "Without replacement: after the first draw, reduce both the count of that item and the total.",
            ] },
            { kind: "tip", text: "Before multiplying, ask whether the first event changes the second. Drawing a ball and keeping it does; rolling a die does not." },
          ],
        },
        {
          heading: "Averages and spread",
          blocks: [
            { kind: "table", head: ["Measure", "How to find it"], rows: [
              ["Mean", "Total ÷ number of values"],
              ["Median", "Middle value when sorted (average the two middle values for an even count)"],
              ["Mode", "Most frequent value"],
              ["Range", "Largest − smallest"],
            ] },
            { kind: "p", text: "The median ignores extremes; the mean does not. A single very large value pulls the mean up and leaves the median alone." },
          ],
        },
      ],
      terms: [
        { term: "Independent events", definition: "Events where one happening does not change the chance of the other." },
        { term: "Mutually exclusive", definition: "Events that cannot both happen." },
        { term: "Complement", definition: "The event not happening; its probability is 1 minus the event's." },
        { term: "Without replacement", definition: "An item drawn is not put back, so later probabilities change." },
      ],
      examples: [
        {
          kind: "mcq", id: "dm-ps-e1",
          stimulus: [{ kind: "p", text: "A bag holds 5 red and 3 blue counters. Two counters are taken out, one after the other, without being put back." }],
          prompt: "What is the probability that both are red?",
          options: ["25/64", "5/14", "5/8", "1/4"], answer: 1,
          explanation: "First red: 5/8. Then 4 reds remain out of 7: 4/7. Both: 5/8 × 4/7 = 20/56 = 5/14. (25/64 would be the answer with replacement.)",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "dm-ps-p1",
          stimulus: [{ kind: "p", text: "A fair six-sided die is rolled twice." }],
          prompt: "What is the probability of rolling at least one six?",
          options: ["1/3", "11/36", "1/36", "5/18"], answer: 1,
          explanation: "No six in two rolls: 5/6 × 5/6 = 25/36. At least one six: 1 − 25/36 = 11/36. (1/3 double-counts the case of two sixes.)",
        },
        {
          kind: "mcq", id: "dm-ps-p2",
          stimulus: [{ kind: "p", text: "A fair coin is tossed three times." }],
          prompt: "What is the probability of exactly two heads?",
          options: ["1/4", "3/8", "1/2", "2/3"], answer: 1,
          explanation: "Eight equally likely outcomes. Exactly two heads: HHT, HTH, THH — three of them. 3/8.",
        },
        {
          kind: "yesno", id: "dm-ps-p3",
          stimulus: [{ kind: "p", text: "Ten students scored the following marks out of 10 in a quiz: 4, 5, 5, 6, 7, 7, 7, 8, 9, 10." }],
          prompt: "Place 'Yes' if the conclusion follows and 'No' if it does not.",
          statements: [
            { text: "The median mark is higher than the mean mark.", answer: true, why: "Median (7 + 7) ÷ 2 = 7; mean 68 ÷ 10 = 6.8." },
            { text: "The mode is 7.", answer: true, why: "7 appears three times, more than any other mark." },
            { text: "More than half the students scored 7 or more.", answer: true, why: "Six of the ten did." },
            { text: "The range of marks is 10.", answer: false, why: "Range = 10 − 4 = 6." },
            { text: "If the 4 were changed to a 6, the median would change.", answer: false, why: "Sorted: 5, 5, 6, 6, 7, 7, 7, 8, 9, 10 — the median is still 7." },
          ],
        },
      ],
    },
  ],
};
