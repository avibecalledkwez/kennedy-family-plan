import { useState, useEffect, useCallback, useRef } from "react";
import {
  saveChecked, loadChecked, subscribeChecked,
  saveSuggestions, loadSuggestions, subscribeSuggestions,
  saveCustomTasks, loadCustomTasks, subscribeCustomTasks,
  saveDeleted, loadDeleted, subscribeDeleted,
} from "./firebase.js";

const DUE = new Date("2026-08-01");

function getCategories(user) {
  const m = user === "marquez";
  return [
    { id:"baby", label:"Baby Kennedy", icon:"👶", color:"#D4878F", dark:"#B8636D" },
    { id:"partner", label:m?"Jasmine":"Marquez", icon:m?"💐":"💪", color:m?"#6AACBF":"#5B8C6F", dark:m?"#3D8EA6":"#3D6B4A" },
    { id:"self", label:"You", icon:m?"💪":"💐", color:m?"#6DAF8B":"#C47DBF", dark:m?"#4A8F6A":"#A35E9E" },
    { id:"finance", label:"Family Finances", icon:"💰", color:"#CDA644", dark:"#A88830" },
    { id:"relationship", label:"Relationship", icon:"❤️", color:"#CF7054", dark:"#B5563D" },
    { id:"family", label:"Family Unit", icon:"🏠", color:"#8E8EC8", dark:"#6E6EAA" },
  ];
}

const segmentMeta = {
  before: [
    { id:"now", title:"Start This Week", subtitle:"Immediate priorities", icon:"🔥", targetDate:"Now" },
    { id:"month1", title:"April – May 2026", subtitle:"~14-18 weeks before due date", icon:"📋", targetDate:"By end of May" },
    { id:"month2", title:"June 2026", subtitle:"~8-12 weeks before due date", icon:"⚡", targetDate:"By end of June" },
    { id:"final", title:"July 2026 — Final Stretch", subtitle:"Last 4 weeks before due date", icon:"🎯", targetDate:"By July 15" },
    { id:"ongoing_before", title:"Ongoing Daily / Weekly", subtitle:"Continuous habits until Kennedy arrives", icon:"🔄", targetDate:"Every day" },
  ],
  after: [
    { id:"week1", title:"Week 1 — The First Days", subtitle:"August 1–7, 2026", icon:"🌟", targetDate:"First week" },
    { id:"first3mo", title:"First 3 Months", subtitle:"August – October 2026", icon:"📆", targetDate:"By October" },
    { id:"ongoing_after", title:"Ongoing Daily / Weekly", subtitle:"Continuous habits for the long haul", icon:"🔄", targetDate:"Every day" },
  ],
};

const TAG_OPTIONS = [
  "Health","Safety","Education","Prep","Supplies","Logistics","Tools","Development","Bonding",
  "Routine","Support","Nutrition","Memories","Community","Comfort","Emotional","Romance",
  "Recovery","Self-care","Partnership","Communication","Planning","Budget","Savings","Insurance",
  "Legal","Debt","Smart Spending","Taxes","Benefits","Income","Alignment","Growth","Vision",
  "Connection","Intimacy","Respect","Values","Boundaries","Organization","Traditions","Activities",
  "Legacy","Environment","Presence","Character","Balance","Social","Mental","Life Skills","Relationship",
];

function isSegmentDueSoon(segId) {
  const now = new Date();
  if (segId === "now") return true;
  if (segId === "ongoing_before" && now < DUE) return true;
  if (segId === "ongoing_after" && now >= DUE) return true;
  if (segId === "month1" && now >= new Date("2026-04-01") && now <= new Date("2026-06-01")) return true;
  if (segId === "month2" && now >= new Date("2026-06-01") && now <= new Date("2026-07-01")) return true;
  if (segId === "final" && now >= new Date("2026-07-01") && now <= new Date("2026-08-01")) return true;
  if (segId === "week1" && now >= new Date("2026-08-01") && now <= new Date("2026-08-08")) return true;
  if (segId === "first3mo" && now >= new Date("2026-08-01") && now <= new Date("2026-11-01")) return true;
  return false;
}

function isCustomTaskDueSoon(task) {
  if (task.ongoing) return true;
  if (!task.dueDate) return false;
  const now = new Date(); const due = new Date(task.dueDate);
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
  return due <= weekEnd;
}

// ═══════════════════════════════════════════════════════════
// ALL BUILT-IN TASKS
// ═══════════════════════════════════════════════════════════
const allTasks = [
  // BABY — Marquez
  {owner:"marquez",cat:"baby",phase:"before",segment:"now",text:"Research and choose a pediatrician — schedule a meet-and-greet",tag:"Health"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"now",text:"Take an infant CPR & first aid class together",tag:"Safety"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"now",text:"Read 'What to Expect the First Year' or a similar newborn guide",tag:"Education"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"now",text:"Research and register for baby gear: stroller, bassinet, bottles, breast pump",tag:"Supplies"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"now",text:"Learn about developmental milestones for the first 12 months",tag:"Education"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"month1",text:"Start setting up the nursery: crib, changing station, sound machine, blackout curtains",tag:"Prep"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"month1",text:"Stock up on diapers (newborn + size 1), wipes, and diaper cream",tag:"Supplies"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"month1",text:"Research breastfeeding basics so you can support Jasmine (latch, positions, pumping)",tag:"Education"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"month1",text:"Learn about safe sleep (ABCs: Alone, Back, Crib) and newborn sleep patterns",tag:"Safety"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"month1",text:"Research cord blood banking — decide if it's right for your family",tag:"Health"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"month2",text:"Install the car seat and get it inspected at a fire station",tag:"Safety"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"month2",text:"Wash and organize all baby clothes (use fragrance-free detergent)",tag:"Prep"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"month2",text:"Set up a diaper station on every floor of your home",tag:"Prep"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"month2",text:"Download tracking apps for feeding, diapers, and sleep (Huckleberry, Baby Tracker)",tag:"Tools"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"month2",text:"Create a baby-proofing checklist for when Kennedy starts crawling",tag:"Safety"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"final",text:"Pack the hospital bag for Kennedy by week 36",tag:"Prep"},
  {owner:"marquez",cat:"baby",phase:"before",segment:"final",text:"Pre-register at the hospital / birthing center",tag:"Logistics"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"week1",text:"Practice skin-to-skin contact regularly — not just for mom",tag:"Bonding"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"week1",text:"Start daily tummy time — begin with 3-5 min sessions",tag:"Development"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"week1",text:"Establish a bedtime routine early (bath, book, song, sleep)",tag:"Routine"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"week1",text:"Take turns doing night feedings so Jasmine can recover",tag:"Support"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"first3mo",text:"Attend all well-baby checkups (2 weeks, 1 month, 2 months)",tag:"Health"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"first3mo",text:"Stay on top of the vaccination schedule",tag:"Health"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"first3mo",text:"Learn infant massage techniques — great for bonding and digestion",tag:"Bonding"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"first3mo",text:"Join a local parent group or dad group for community and advice",tag:"Community"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"ongoing_after",text:"Read to Kennedy daily — board books, high-contrast cards",tag:"Development"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"ongoing_after",text:"Talk and sing to Kennedy constantly — narrate your day to build language",tag:"Development"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"ongoing_after",text:"Track and celebrate developmental milestones (first smile, rolling over)",tag:"Development"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"ongoing_after",text:"Create a photo/video journal — document monthly milestones",tag:"Memories"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"ongoing_after",text:"Expose Kennedy to different textures, sounds, and environments",tag:"Development"},
  {owner:"marquez",cat:"baby",phase:"after",segment:"ongoing_after",text:"Research and plan for introducing solid foods around 6 months",tag:"Nutrition"},
  // BABY — Jasmine
  {owner:"jasmine",cat:"baby",phase:"before",segment:"now",text:"Research pediatricians and schedule a meet-and-greet together",tag:"Health"},
  {owner:"jasmine",cat:"baby",phase:"before",segment:"now",text:"Take an infant CPR & first aid class with Marquez",tag:"Safety"},
  {owner:"jasmine",cat:"baby",phase:"before",segment:"now",text:"Read up on newborn care — feeding, sleep, and soothing techniques",tag:"Education"},
  {owner:"jasmine",cat:"baby",phase:"before",segment:"month1",text:"Create your baby registry — research essentials vs. nice-to-haves",tag:"Supplies"},
  {owner:"jasmine",cat:"baby",phase:"before",segment:"month1",text:"Take a breastfeeding class or meet with a lactation consultant",tag:"Education"},
  {owner:"jasmine",cat:"baby",phase:"before",segment:"month1",text:"Start planning the nursery layout and design together",tag:"Prep"},
  {owner:"jasmine",cat:"baby",phase:"before",segment:"month2",text:"Pack your hospital bag with your comfort items",tag:"Prep"},
  {owner:"jasmine",cat:"baby",phase:"before",segment:"month2",text:"Prepare a playlist or comfort items for labor and delivery",tag:"Prep"},
  {owner:"jasmine",cat:"baby",phase:"before",segment:"month2",text:"Pre-wash all baby clothes and organize by size",tag:"Prep"},
  {owner:"jasmine",cat:"baby",phase:"after",segment:"week1",text:"Focus on recovery and bonding — let Marquez handle the household",tag:"Recovery"},
  {owner:"jasmine",cat:"baby",phase:"after",segment:"week1",text:"Establish a breastfeeding routine — don't hesitate to ask for lactation support",tag:"Health"},
  {owner:"jasmine",cat:"baby",phase:"after",segment:"first3mo",text:"Attend all well-baby checkups together",tag:"Health"},
  {owner:"jasmine",cat:"baby",phase:"after",segment:"first3mo",text:"Join a new-mom support group for community and advice",tag:"Community"},
  {owner:"jasmine",cat:"baby",phase:"after",segment:"ongoing_after",text:"Read and sing to Kennedy daily — it builds language and bonding",tag:"Development"},
  {owner:"jasmine",cat:"baby",phase:"after",segment:"ongoing_after",text:"Document milestones and memories in a journal or app",tag:"Memories"},
  // MARQUEZ → PARTNER
  {owner:"marquez",cat:"partner",phase:"before",segment:"now",text:"Attend every prenatal appointment with her — be present and engaged",tag:"Support"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"now",text:"Research postpartum depression signs so you can recognize them early",tag:"Health"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"now",text:"Take a birthing class together (Lamaze, Bradley Method, or hospital class)",tag:"Education"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"now",text:"Learn about the stages of labor so you know what to expect",tag:"Education"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"month1",text:"Help her create a birth plan and discuss preferences together",tag:"Planning"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"month1",text:"Plan a special date night or babymoon trip before Kennedy arrives",tag:"Relationship"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"month1",text:"Ask her what kind of support she wants during labor — listen, don't assume",tag:"Communication"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"month2",text:"Set up a postpartum recovery station (pads, Tucks, peri bottle, snacks)",tag:"Recovery"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"month2",text:"Help her pack her hospital bag with comfort items she loves",tag:"Prep"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"month2",text:"Write her a heartfelt letter about what she means to you",tag:"Relationship"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"ongoing_before",text:"Give her regular foot rubs and back massages — pregnancy is exhausting",tag:"Comfort"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"ongoing_before",text:"Take over household chores she's struggling with",tag:"Support"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"ongoing_before",text:"Cook nutritious meals and ensure she's staying hydrated",tag:"Health"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"ongoing_before",text:"Be patient with mood swings — hormones are intense during pregnancy",tag:"Emotional"},
  {owner:"marquez",cat:"partner",phase:"before",segment:"ongoing_before",text:"Tell her she's beautiful — her body is changing and she may feel insecure",tag:"Relationship"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"week1",text:"Protect her rest — handle visitors, cook, clean, and manage the household",tag:"Support"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"week1",text:"Bring her water and snacks during breastfeeding sessions",tag:"Support"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"week1",text:"Give her alone time to shower, nap, or just breathe",tag:"Self-care"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"first3mo",text:"Watch for signs of postpartum depression or anxiety — gently encourage help",tag:"Health"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"first3mo",text:"If she's breastfeeding, learn about lactation challenges and how to help",tag:"Support"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"first3mo",text:"Encourage her to connect with other new moms",tag:"Community"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"ongoing_after",text:"Tell her she's doing an amazing job as a mother — daily",tag:"Emotional"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"ongoing_after",text:"Don't wait to be asked — anticipate needs and just do things",tag:"Support"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"ongoing_after",text:"Keep the romance alive — small gestures (flowers, notes, her favorite snack)",tag:"Relationship"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"ongoing_after",text:"Support her body image journey — her body just performed a miracle",tag:"Emotional"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"ongoing_after",text:"Be her partner, not her helper — own your role as an equal parent",tag:"Partnership"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"ongoing_after",text:"Encourage and support her return to hobbies or interests she loves",tag:"Self-care"},
  {owner:"marquez",cat:"partner",phase:"after",segment:"ongoing_after",text:"Plan regular date nights even if it's just takeout after Kennedy sleeps",tag:"Relationship"},
  // JASMINE → PARTNER
  {owner:"jasmine",cat:"partner",phase:"before",segment:"now",text:"Share how you're feeling openly — let him know how to support you",tag:"Communication"},
  {owner:"jasmine",cat:"partner",phase:"before",segment:"now",text:"Encourage his involvement — let him take ownership of baby prep tasks",tag:"Partnership"},
  {owner:"jasmine",cat:"partner",phase:"before",segment:"month1",text:"Plan a babymoon or special date night together before Kennedy arrives",tag:"Relationship"},
  {owner:"jasmine",cat:"partner",phase:"before",segment:"month1",text:"Discuss his fears and excitement about fatherhood — create space for him",tag:"Communication"},
  {owner:"jasmine",cat:"partner",phase:"before",segment:"ongoing_before",text:"Express appreciation for what he does — specifics matter more than general thanks",tag:"Relationship"},
  {owner:"jasmine",cat:"partner",phase:"before",segment:"ongoing_before",text:"Include him in decisions about the baby — he's your partner, not a bystander",tag:"Partnership"},
  {owner:"jasmine",cat:"partner",phase:"after",segment:"first3mo",text:"Let him develop his own parenting style — resist correcting unless safety is involved",tag:"Partnership"},
  {owner:"jasmine",cat:"partner",phase:"after",segment:"first3mo",text:"Watch for signs that he may be struggling emotionally — dads get PPD too",tag:"Health"},
  {owner:"jasmine",cat:"partner",phase:"after",segment:"ongoing_after",text:"Protect couple time — even 15 min of connection after Kennedy sleeps",tag:"Relationship"},
  {owner:"jasmine",cat:"partner",phase:"after",segment:"ongoing_after",text:"Acknowledge his efforts as a father — words of affirmation go a long way",tag:"Emotional"},
  {owner:"jasmine",cat:"partner",phase:"after",segment:"ongoing_after",text:"Encourage him to maintain friendships and personal interests",tag:"Support"},
  {owner:"jasmine",cat:"partner",phase:"after",segment:"ongoing_after",text:"Be patient as you both learn your new roles — give grace generously",tag:"Emotional"},
  // MARQUEZ → SELF
  {owner:"marquez",cat:"self",phase:"before",segment:"now",text:"Read at least 2 books on fatherhood (try 'The Expectant Father' by Armin Brott)",tag:"Education"},
  {owner:"marquez",cat:"self",phase:"before",segment:"now",text:"See your doctor for a general checkup — make sure you're healthy",tag:"Health"},
  {owner:"marquez",cat:"self",phase:"before",segment:"now",text:"Consider therapy or counseling proactively — fatherhood brings up a lot",tag:"Mental"},
  {owner:"marquez",cat:"self",phase:"before",segment:"month1",text:"Start journaling — process your fears, excitement, and goals for fatherhood",tag:"Mental"},
  {owner:"marquez",cat:"self",phase:"before",segment:"month1",text:"Build a support network — connect with other dads, friends, or a mentor",tag:"Mental"},
  {owner:"marquez",cat:"self",phase:"before",segment:"month1",text:"Learn to cook 5-10 simple, healthy meals if you don't already",tag:"Life Skills"},
  {owner:"marquez",cat:"self",phase:"before",segment:"month2",text:"Set personal goals for the next year beyond fatherhood — stay well-rounded",tag:"Growth"},
  {owner:"marquez",cat:"self",phase:"before",segment:"month2",text:"Start waking up earlier to build discipline and create personal time",tag:"Routine"},
  {owner:"marquez",cat:"self",phase:"before",segment:"ongoing_before",text:"Maintain a consistent exercise routine — you'll need the energy",tag:"Health"},
  {owner:"marquez",cat:"self",phase:"before",segment:"ongoing_before",text:"Practice stress management (meditation, deep breathing, exercise)",tag:"Mental"},
  {owner:"marquez",cat:"self",phase:"before",segment:"ongoing_before",text:"Prioritize good sleep hygiene before sleep deprivation hits",tag:"Health"},
  {owner:"marquez",cat:"self",phase:"before",segment:"ongoing_before",text:"Reduce or eliminate unhealthy habits (excessive drinking, poor diet, screen addiction)",tag:"Health"},
  {owner:"marquez",cat:"self",phase:"after",segment:"first3mo",text:"Check in with yourself emotionally — dads can experience PPD too",tag:"Mental"},
  {owner:"marquez",cat:"self",phase:"after",segment:"first3mo",text:"Get comfortable asking for help — it's strength, not weakness",tag:"Mental"},
  {owner:"marquez",cat:"self",phase:"after",segment:"ongoing_after",text:"Maintain your exercise routine even if it's 20 minutes — protect this time",tag:"Health"},
  {owner:"marquez",cat:"self",phase:"after",segment:"ongoing_after",text:"Continue journaling about your fatherhood journey",tag:"Mental"},
  {owner:"marquez",cat:"self",phase:"after",segment:"ongoing_after",text:"Don't neglect your friendships — schedule time with your people",tag:"Social"},
  {owner:"marquez",cat:"self",phase:"after",segment:"ongoing_after",text:"Accept that you won't be perfect — give yourself grace",tag:"Mental"},
  {owner:"marquez",cat:"self",phase:"after",segment:"ongoing_after",text:"Set work boundaries — family time is sacred",tag:"Balance"},
  {owner:"marquez",cat:"self",phase:"after",segment:"ongoing_after",text:"Model the man you want Kennedy to look for in a future partner",tag:"Character"},
  {owner:"marquez",cat:"self",phase:"after",segment:"ongoing_after",text:"Make time for hobbies that recharge you — even 30 min matters",tag:"Self-care"},
  {owner:"marquez",cat:"self",phase:"after",segment:"ongoing_after",text:"Practice patience daily — with yourself, Jasmine, and Kennedy",tag:"Character"},
  {owner:"marquez",cat:"self",phase:"after",segment:"ongoing_after",text:"Stay hydrated, eat well, and don't survive on coffee alone",tag:"Health"},
  // JASMINE → SELF
  {owner:"jasmine",cat:"self",phase:"before",segment:"now",text:"Talk to your OB about a birth plan and any concerns or preferences",tag:"Health"},
  {owner:"jasmine",cat:"self",phase:"before",segment:"now",text:"Read a pregnancy/postpartum book you connect with (try 'The Fourth Trimester')",tag:"Education"},
  {owner:"jasmine",cat:"self",phase:"before",segment:"now",text:"Consider therapy or a support group — pregnancy brings up a lot of emotions",tag:"Mental"},
  {owner:"jasmine",cat:"self",phase:"before",segment:"month1",text:"Start or continue a prenatal exercise routine (yoga, walking, swimming)",tag:"Health"},
  {owner:"jasmine",cat:"self",phase:"before",segment:"month1",text:"Journal about your hopes, fears, and vision for motherhood",tag:"Mental"},
  {owner:"jasmine",cat:"self",phase:"before",segment:"month1",text:"Build your postpartum support circle — identify your go-to people",tag:"Mental"},
  {owner:"jasmine",cat:"self",phase:"before",segment:"month2",text:"Practice relaxation and breathing techniques for labor",tag:"Health"},
  {owner:"jasmine",cat:"self",phase:"before",segment:"month2",text:"Set personal goals beyond motherhood — your identity matters",tag:"Growth"},
  {owner:"jasmine",cat:"self",phase:"before",segment:"ongoing_before",text:"Prioritize rest and listen to your body — nap when you can",tag:"Health"},
  {owner:"jasmine",cat:"self",phase:"before",segment:"ongoing_before",text:"Stay connected with friends — don't isolate during pregnancy",tag:"Social"},
  {owner:"jasmine",cat:"self",phase:"before",segment:"ongoing_before",text:"Eat nourishing foods and stay hydrated — fuel your body well",tag:"Health"},
  {owner:"jasmine",cat:"self",phase:"after",segment:"first3mo",text:"Be honest about how you're feeling — ask for help if you're struggling",tag:"Mental"},
  {owner:"jasmine",cat:"self",phase:"after",segment:"first3mo",text:"Don't compare yourself to other moms — your journey is yours",tag:"Mental"},
  {owner:"jasmine",cat:"self",phase:"after",segment:"first3mo",text:"Schedule your postpartum checkup and be honest with your doctor",tag:"Health"},
  {owner:"jasmine",cat:"self",phase:"after",segment:"ongoing_after",text:"Carve out time for yourself regularly — you can't pour from an empty cup",tag:"Self-care"},
  {owner:"jasmine",cat:"self",phase:"after",segment:"ongoing_after",text:"Reconnect with hobbies and interests that make you feel like YOU",tag:"Self-care"},
  {owner:"jasmine",cat:"self",phase:"after",segment:"ongoing_after",text:"Move your body in ways that feel good — gentle walks, yoga, whatever works",tag:"Health"},
  {owner:"jasmine",cat:"self",phase:"after",segment:"ongoing_after",text:"Practice self-compassion — you're learning, and that's okay",tag:"Mental"},
  {owner:"jasmine",cat:"self",phase:"after",segment:"ongoing_after",text:"Stay connected with friends — schedule regular catch-ups",tag:"Social"},
  {owner:"jasmine",cat:"self",phase:"after",segment:"ongoing_after",text:"Give yourself grace with your body — it did something incredible",tag:"Mental"},
  // SHARED — Finance
  {owner:"shared",cat:"finance",phase:"before",segment:"now",text:"Create a detailed monthly budget that accounts for baby expenses",tag:"Budget"},
  {owner:"shared",cat:"finance",phase:"before",segment:"now",text:"Review health insurance — understand coverage and add Kennedy within 30 days of birth",tag:"Insurance"},
  {owner:"shared",cat:"finance",phase:"before",segment:"now",text:"Get life insurance for both of you (term life is affordable)",tag:"Insurance"},
  {owner:"shared",cat:"finance",phase:"before",segment:"now",text:"Review workplace benefits — parental leave, FSA/HSA, dependent care",tag:"Benefits"},
  {owner:"shared",cat:"finance",phase:"before",segment:"month1",text:"Build an emergency fund — aim for 3-6 months of expenses minimum",tag:"Savings"},
  {owner:"shared",cat:"finance",phase:"before",segment:"month1",text:"Pay down high-interest debt aggressively before Kennedy arrives",tag:"Debt"},
  {owner:"shared",cat:"finance",phase:"before",segment:"month1",text:"Create or update your will and designate a guardian for Kennedy",tag:"Legal"},
  {owner:"shared",cat:"finance",phase:"before",segment:"month1",text:"Look into disability insurance to protect your income",tag:"Insurance"},
  {owner:"shared",cat:"finance",phase:"before",segment:"month2",text:"Start or increase contributions to a 529 college savings plan",tag:"Savings"},
  {owner:"shared",cat:"finance",phase:"before",segment:"month2",text:"Research the cost of childcare in your area and plan accordingly",tag:"Planning"},
  {owner:"shared",cat:"finance",phase:"before",segment:"month2",text:"Set up a separate savings account for baby-specific expenses",tag:"Savings"},
  {owner:"shared",cat:"finance",phase:"before",segment:"month2",text:"Research tax benefits — Child Tax Credit, dependent care FSA",tag:"Taxes"},
  {owner:"shared",cat:"finance",phase:"before",segment:"ongoing_before",text:"Compare prices on baby essentials — buy in bulk, use registries, accept hand-me-downs",tag:"Smart Spending"},
  {owner:"shared",cat:"finance",phase:"after",segment:"week1",text:"Apply for Kennedy's Social Security number at the hospital",tag:"Legal"},
  {owner:"shared",cat:"finance",phase:"after",segment:"first3mo",text:"Track all baby expenses for the first 3 months — adjust budget based on reality",tag:"Budget"},
  {owner:"shared",cat:"finance",phase:"after",segment:"first3mo",text:"Update tax withholding to reflect your new dependent",tag:"Taxes"},
  {owner:"shared",cat:"finance",phase:"after",segment:"first3mo",text:"Add Kennedy as a beneficiary on life insurance and retirement accounts",tag:"Insurance"},
  {owner:"shared",cat:"finance",phase:"after",segment:"first3mo",text:"Set up a UTMA/UGMA custodial account for gifts Kennedy receives",tag:"Savings"},
  {owner:"shared",cat:"finance",phase:"after",segment:"ongoing_after",text:"Automate savings — even $50/month into a 529 adds up significantly",tag:"Savings"},
  {owner:"shared",cat:"finance",phase:"after",segment:"ongoing_after",text:"Review your budget quarterly — baby costs change fast as she grows",tag:"Budget"},
  {owner:"shared",cat:"finance",phase:"after",segment:"ongoing_after",text:"Explore ways to increase household income — career growth, side projects",tag:"Income"},
  {owner:"shared",cat:"finance",phase:"after",segment:"ongoing_after",text:"Build a date night fund — investing in your relationship is a family expense",tag:"Budget"},
  // SHARED — Relationship
  {owner:"shared",cat:"relationship",phase:"before",segment:"now",text:"Read 'The 5 Love Languages' together and discuss each other's primary language",tag:"Communication"},
  {owner:"shared",cat:"relationship",phase:"before",segment:"now",text:"Establish a weekly check-in where you both share how you're feeling honestly",tag:"Communication"},
  {owner:"shared",cat:"relationship",phase:"before",segment:"now",text:"Discuss parenting styles and align on key values before Kennedy arrives",tag:"Alignment"},
  {owner:"shared",cat:"relationship",phase:"before",segment:"month1",text:"Talk about division of labor — who does what, and be flexible",tag:"Planning"},
  {owner:"shared",cat:"relationship",phase:"before",segment:"month1",text:"Learn to fight fair together — no name-calling, stonewalling, or keeping score",tag:"Communication"},
  {owner:"shared",cat:"relationship",phase:"before",segment:"month1",text:"Consider couples counseling to strengthen your foundation",tag:"Growth"},
  {owner:"shared",cat:"relationship",phase:"before",segment:"month2",text:"Learn about the Gottman Method together — research-backed relationship strategies",tag:"Education"},
  {owner:"shared",cat:"relationship",phase:"before",segment:"month2",text:"Create shared goals — where do you want to be in 1, 5, 10 years?",tag:"Vision"},
  {owner:"shared",cat:"relationship",phase:"before",segment:"month2",text:"Discuss how you'll handle conflict in front of Kennedy",tag:"Alignment"},
  {owner:"shared",cat:"relationship",phase:"before",segment:"ongoing_before",text:"Express gratitude daily — tell each other specific things you appreciate",tag:"Romance"},
  {owner:"shared",cat:"relationship",phase:"before",segment:"ongoing_before",text:"Protect regular date nights — make couple time non-negotiable",tag:"Romance"},
  {owner:"shared",cat:"relationship",phase:"after",segment:"ongoing_after",text:"Keep the weekly check-ins going — they matter even more now",tag:"Communication"},
  {owner:"shared",cat:"relationship",phase:"after",segment:"ongoing_after",text:"Don't let the baby become the only thing you talk about",tag:"Connection"},
  {owner:"shared",cat:"relationship",phase:"after",segment:"ongoing_after",text:"Physical affection matters — hold hands, hug, kiss, even when exhausted",tag:"Intimacy"},
  {owner:"shared",cat:"relationship",phase:"after",segment:"ongoing_after",text:"Be patient with the intimacy timeline after birth — communicate openly",tag:"Intimacy"},
  {owner:"shared",cat:"relationship",phase:"after",segment:"ongoing_after",text:"Defend your relationship against outside opinions — you're a team",tag:"Partnership"},
  {owner:"shared",cat:"relationship",phase:"after",segment:"ongoing_after",text:"Apologize quickly when you're wrong — ego has no place in partnership",tag:"Communication"},
  {owner:"shared",cat:"relationship",phase:"after",segment:"ongoing_after",text:"Celebrate small wins together — first bath, first giggle, surviving a tough night",tag:"Connection"},
  {owner:"shared",cat:"relationship",phase:"after",segment:"ongoing_after",text:"Schedule a monthly 'state of the union' talk about your relationship health",tag:"Communication"},
  {owner:"shared",cat:"relationship",phase:"after",segment:"ongoing_after",text:"Continue learning together — podcasts, books, or workshops on relationships",tag:"Growth"},
  // SHARED — Family
  {owner:"shared",cat:"family",phase:"before",segment:"now",text:"Discuss and decide on your family values — what matters most to you both?",tag:"Values"},
  {owner:"shared",cat:"family",phase:"before",segment:"now",text:"Create a family mission statement together",tag:"Vision"},
  {owner:"shared",cat:"family",phase:"before",segment:"now",text:"Discuss screen time, discipline philosophy, and education goals early",tag:"Alignment"},
  {owner:"shared",cat:"family",phase:"before",segment:"month1",text:"Set boundaries with extended family about visits, advice, and involvement",tag:"Boundaries"},
  {owner:"shared",cat:"family",phase:"before",segment:"month1",text:"Research family health history on both sides for Kennedy's medical records",tag:"Health"},
  {owner:"shared",cat:"family",phase:"before",segment:"month1",text:"Set up a family calendar system to manage appointments and tasks",tag:"Organization"},
  {owner:"shared",cat:"family",phase:"before",segment:"month2",text:"Plan parental leave strategically — stagger if possible for max coverage",tag:"Planning"},
  {owner:"shared",cat:"family",phase:"before",segment:"month2",text:"Create a contact list of people who can help (meals, errands, support)",tag:"Community"},
  {owner:"shared",cat:"family",phase:"before",segment:"month2",text:"Discuss spiritual or religious practices you want for your family",tag:"Values"},
  {owner:"shared",cat:"family",phase:"before",segment:"final",text:"Meal prep and freeze meals for the first 2 weeks after Kennedy arrives",tag:"Prep"},
  {owner:"shared",cat:"family",phase:"after",segment:"ongoing_after",text:"Establish family traditions early — Sunday pancakes, evening walks, bedtime stories",tag:"Traditions"},
  {owner:"shared",cat:"family",phase:"after",segment:"ongoing_after",text:"Take a family photo every month to document Kennedy's growth",tag:"Memories"},
  {owner:"shared",cat:"family",phase:"after",segment:"ongoing_after",text:"Create a family email address to save memories and letters for Kennedy",tag:"Memories"},
  {owner:"shared",cat:"family",phase:"after",segment:"ongoing_after",text:"Build a village — nurture relationships with people who support you",tag:"Community"},
  {owner:"shared",cat:"family",phase:"after",segment:"ongoing_after",text:"Schedule regular family outings — parks, library story time, baby activities",tag:"Activities"},
  {owner:"shared",cat:"family",phase:"after",segment:"ongoing_after",text:"Create a safe, loving, stable home — consistency is everything",tag:"Environment"},
  {owner:"shared",cat:"family",phase:"after",segment:"ongoing_after",text:"Document family recipes, stories, and traditions to pass down",tag:"Legacy"},
  {owner:"shared",cat:"family",phase:"after",segment:"ongoing_after",text:"Practice being fully present during family time — phones down, eyes up",tag:"Presence"},
];

// Assign stable keys to built-in tasks (position-independent of filtering)
allTasks.forEach((t,i) => { t._stableKey = `t-${i}`; });

const tagColors = {
  Safety:"#E74C3C",Health:"#1ABC9C",Education:"#3498DB",Prep:"#27AE60",Supplies:"#F39C12",
  Logistics:"#9B59B6",Tools:"#16A085",Development:"#2ECC71",Bonding:"#E8A0BF",Routine:"#8E44AD",
  Support:"#3498DB",Nutrition:"#27AE60",Memories:"#E67E22",Community:"#5DADE2",Finance:"#F1C40F",
  Comfort:"#AF7AC5",Emotional:"#EC7063",Romance:"#E74C3C",Recovery:"#48C9B0","Self-care":"#F0B27A",
  Partnership:"#85929E",Communication:"#5DADE2",Planning:"#7FB3D8",Budget:"#F1C40F",Savings:"#2ECC71",
  Insurance:"#5DADE2",Legal:"#95A5A6",Debt:"#E74C3C","Smart Spending":"#58D68D",Taxes:"#AF7AC5",
  Benefits:"#48C9B0",Income:"#F4D03F",Alignment:"#85C1E9",Growth:"#52BE80",Vision:"#F1948A",
  Connection:"#82E0AA",Intimacy:"#E59866",Respect:"#5DADE2",Values:"#AF7AC5",Boundaries:"#E74C3C",
  Organization:"#7FB3D8",Traditions:"#F7DC6F",Activities:"#82E0AA",Legacy:"#E59866",
  Environment:"#58D68D",Presence:"#85C1E9",Character:"#BB8FCE",Balance:"#52BE80",
  Social:"#5DADE2",Mental:"#AF7AC5","Life Skills":"#7FB3D8",Suggested:"#FF9F43",Relationship:"#CF7054",Custom:"#FF9F43",
};

function getTasksForView(user,catId,phase) {
  if (["finance","relationship","family"].includes(catId)) return allTasks.filter(t=>t.cat===catId&&t.phase===phase);
  return allTasks.filter(t=>t.cat===catId&&t.phase===phase&&t.owner===user);
}

function TaskCard({task,done,onToggle,catColor,onDelete}) {
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"13px 16px",borderRadius:12,background:done?"#F9F9F9":"white",border:`1px solid ${done?"#EAEAEA":"#EFEFEF"}`,opacity:done?0.5:1,boxShadow:done?"none":"0 1px 3px rgba(0,0,0,0.03)",transition:"all 0.15s ease"}}>
      <div onClick={onToggle} style={{width:21,height:21,borderRadius:6,flexShrink:0,marginTop:1,border:done?"none":`2px solid ${catColor}`,background:done?catColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        {done&&<svg width="12" height="9" viewBox="0 0 13 10" fill="none"><path d="M1.5 5L5 8.5L11.5 1.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <div onClick={onToggle} style={{flex:1,cursor:"pointer"}}>
        <div style={{fontSize:14,lineHeight:1.5,fontFamily:"system-ui",color:done?"#BBB":"#2A2A2A",textDecoration:done?"line-through":"none"}}>{task.text}</div>
        <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
          <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,fontFamily:"system-ui",fontWeight:600,background:(tagColors[task.tag]||"#999")+"15",color:tagColors[task.tag]||"#999"}}>{task.tag}</span>
          {task.isSuggestion&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:4,fontFamily:"system-ui",fontWeight:600,background:"#FF9F4318",color:"#E67E22"}}>✨ {task.from}</span>}
          {task.isCustom&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:4,fontFamily:"system-ui",fontWeight:600,background:"#FF9F4318",color:"#E67E22"}}>✏️ Custom</span>}
          {task.dueDate&&!task.ongoing&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:4,fontFamily:"system-ui",fontWeight:600,background:"#3498DB15",color:"#3498DB"}}>Due {new Date(task.dueDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>}
          {task.ongoing&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:4,fontFamily:"system-ui",fontWeight:600,background:"#8E44AD15",color:"#8E44AD"}}>🔄 Ongoing</span>}
        </div>
      </div>
      {onDelete&&<button onClick={(e)=>{e.stopPropagation();onDelete();}} title="Delete task" style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#CCC",padding:"2px 4px",flexShrink:0,lineHeight:1,marginTop:1,transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color="#E74C3C"} onMouseLeave={e=>e.currentTarget.style.color="#CCC"}>×</button>}
    </div>
  );
}

export default function App() {
  const [view,setView]=useState("main");
  const [activeCat,setActiveCat]=useState("baby");
  const [phase,setPhase]=useState("before");
  const [checked,setChecked]=useState({});
  const [user,setUser]=useState(null);
  const [suggestions,setSuggestions]=useState([]);
  const [customTasks,setCustomTasks]=useState([]);
  const [addingTask,setAddingTask]=useState(false);
  const [newTaskText,setNewTaskText]=useState("");
  const [newTaskFor,setNewTaskFor]=useState("marquez");
  const [newTaskTag,setNewTaskTag]=useState("Health");
  const [newTaskOngoing,setNewTaskOngoing]=useState(false);
  const [newTaskStart,setNewTaskStart]=useState("");
  const [newTaskDue,setNewTaskDue]=useState("");
  const [newTaskSegment,setNewTaskSegment]=useState("now");
  const [deleted,setDeleted]=useState({});
  const [loaded,setLoaded]=useState(false);

  // Track last save timestamps to avoid echo loops
  const lastSaveTime = useRef({checked:0,suggestions:0,custom:0,deleted:0});

  // ── Initial load from Firebase ──
  useEffect(()=>{
    (async()=>{
      const [c,s,t,d] = await Promise.all([loadChecked(),loadSuggestions(),loadCustomTasks(),loadDeleted()]);
      setChecked(c); setSuggestions(s); setCustomTasks(t); setDeleted(d);
      setLoaded(true);
    })();
  },[]);

  // ── Subscribe for remote changes ──
  useEffect(()=>{
    const u1=subscribeChecked(d=>{if(Date.now()-lastSaveTime.current.checked>2000) setChecked(d);});
    const u2=subscribeSuggestions(d=>{if(Date.now()-lastSaveTime.current.suggestions>2000) setSuggestions(d);});
    const u3=subscribeCustomTasks(d=>{if(Date.now()-lastSaveTime.current.custom>2000) setCustomTasks(d);});
    const u4=subscribeDeleted(d=>{if(Date.now()-lastSaveTime.current.deleted>2000) setDeleted(d);});
    return ()=>{u1();u2();u3();u4();};
  },[]);

  // ── Save functions ──
  const doSaveChecked = useCallback((data)=>{lastSaveTime.current.checked=Date.now();saveChecked(data);},[]);
  const doSaveSuggestions = useCallback((data)=>{lastSaveTime.current.suggestions=Date.now();saveSuggestions(data);},[]);
  const doSaveCustomTasks = useCallback((data)=>{lastSaveTime.current.custom=Date.now();saveCustomTasks(data);},[]);
  const doSaveDeleted = useCallback((data)=>{lastSaveTime.current.deleted=Date.now();saveDeleted(data);},[]);

  const toggleCheck = useCallback(k=>{
    setChecked(p=>{const next={...p,[k]:!p[k]};doSaveChecked(next);return next;});
  },[doSaveChecked]);

  const handleDelete = useCallback((task)=>{
    if(!window.confirm("Delete this task?")) return;
    // Remove from checked
    setChecked(p=>{const next={...p};delete next[task._stableKey];doSaveChecked(next);return next;});
    // Mark as deleted for built-in tasks
    setDeleted(p=>{const next={...p,[task._stableKey]:true};doSaveDeleted(next);return next;});
    // Remove custom/suggestion from arrays too
    if(task.isCustom){setCustomTasks(p=>{const next=p.filter(t=>t.id!==task.id);doSaveCustomTasks(next);return next;});}
    if(task.isSuggestion){setSuggestions(p=>{const next=p.filter(s=>s.id!==task.id);doSaveSuggestions(next);return next;});}
  },[doSaveChecked,doSaveDeleted,doSaveCustomTasks,doSaveSuggestions]);

  const handleUncomplete = useCallback((key)=>{
    setChecked(p=>{const next={...p};delete next[key];doSaveChecked(next);return next;});
  },[doSaveChecked]);

  const categories = user ? getCategories(user) : [];
  const cat = categories.find(c=>c.id===activeCat)||categories[0];
  const segments = segmentMeta[phase]||[];
  const visibleTasks = user ? getTasksForView(user,activeCat,phase) : [];
  const myCustom = customTasks.filter(t=>t.cat===activeCat&&t.phase===phase&&(["finance","relationship","family"].includes(t.cat)||t.for===user));
  const acceptedSuggs = suggestions.filter(s=>s.accepted&&s.cat===activeCat&&s.phase===phase&&(["finance","relationship","family"].includes(s.cat)||s.for===user));

  // Build task groups with stable keys (before filtering)
  const rawGroupedTasks = segments.map(seg=>{
    const base = visibleTasks.filter(t=>t.segment===seg.id);
    const custom = myCustom.filter(t=>t.segment===seg.id).map(t=>({...t,isCustom:true,_stableKey:`c-${t.id}`}));
    const suggs = acceptedSuggs.filter(s=>s.segment===seg.id).map(s=>({...s,isSuggestion:true,_stableKey:`s-${s.id}`}));
    return {...seg,tasks:[...base,...custom,...suggs]};
  });

  // Filter out checked and deleted tasks for display
  const groupedTasks = rawGroupedTasks.map(g=>({...g,tasks:g.tasks.filter(t=>!checked[t._stableKey]&&!deleted[t._stableKey])})).filter(g=>g.tasks.length>0);

  const mySuggestions = suggestions.filter(s=>!s.accepted&&!s.dismissed&&s.for===user);
  const completedAll = Object.values(checked).filter(Boolean).length;
  const currentDone = rawGroupedTasks.reduce((a,g)=>a+g.tasks.filter(t=>checked[t._stableKey]).length,0);
  const currentTotal = rawGroupedTasks.reduce((a,g)=>a+g.tasks.filter(t=>!deleted[t._stableKey]).length,0);

  const today = new Date();
  const daysUntil = Math.max(0,Math.ceil((DUE-today)/86400000));
  const weeksUntil = Math.floor(daysUntil/7);
  const otherUser = user==="marquez"?"jasmine":"marquez";
  const otherName = user==="marquez"?"Jasmine":"Marquez";
  const myName = user==="marquez"?"Marquez":"Jasmine";

  // Focus tasks (use same _stableKey so checking syncs across views)
  const focusTasks = [];
  if (user) {
    for (const cid of categories.map(c=>c.id)) {
      const shared=["finance","relationship","family"].includes(cid);
      for (const ph of ["before","after"]) {
        const ts=shared?allTasks.filter(t=>t.cat===cid&&t.phase===ph):allTasks.filter(t=>t.cat===cid&&t.phase===ph&&t.owner===user);
        for (const t of ts) if(isSegmentDueSoon(t.segment)&&!deleted[t._stableKey]) focusTasks.push({...t,_catId:cid});
        for (const t of customTasks.filter(t=>t.cat===cid&&t.phase===ph&&(shared||t.for===user))) {
          const key=`c-${t.id}`;
          if(isCustomTaskDueSoon(t)&&!deleted[key]) focusTasks.push({...t,isCustom:true,_stableKey:key,_catId:cid});
        }
      }
    }
  }
  const focusUndone = focusTasks.filter(t=>!checked[t._stableKey]);

  // Build completed tasks list (across all categories)
  const completedTasksList = [];
  if (user) {
    for (const catInfo of categories) {
      const shared=["finance","relationship","family"].includes(catInfo.id);
      for (const ph of ["before","after"]) {
        const ts=shared?allTasks.filter(t=>t.cat===catInfo.id&&t.phase===ph):allTasks.filter(t=>t.cat===catInfo.id&&t.phase===ph&&t.owner===user);
        for (const t of ts) if(checked[t._stableKey]&&!deleted[t._stableKey]) completedTasksList.push({...t,_catInfo:catInfo});
        for (const t of customTasks.filter(ct=>ct.cat===catInfo.id&&ct.phase===ph&&(shared||ct.for===user))) {
          const key=`c-${t.id}`;
          if(checked[key]&&!deleted[key]) completedTasksList.push({...t,isCustom:true,_stableKey:key,_catInfo:catInfo});
        }
        for (const s of suggestions.filter(s=>s.accepted&&s.cat===catInfo.id&&s.phase===ph&&(shared||s.for===user))) {
          const key=`s-${s.id}`;
          if(checked[key]&&!deleted[key]) completedTasksList.push({...s,isSuggestion:true,_stableKey:key,_catInfo:catInfo});
        }
      }
    }
  }

  const handleAddTask = () => {
    if(!newTaskText.trim()) return;
    const isForOther = newTaskFor!==user;
    if(isForOther) {
      const next=[...suggestions,{id:Date.now().toString(),from:myName,for:newTaskFor,text:newTaskText.trim(),tag:newTaskTag,cat:activeCat,phase,segment:newTaskSegment,accepted:false,dismissed:false,ongoing:newTaskOngoing,startDate:newTaskStart||null,dueDate:newTaskDue||null}];
      setSuggestions(next);
      doSaveSuggestions(next);
    } else {
      const next=[...customTasks,{id:Date.now().toString(),for:user,text:newTaskText.trim(),tag:newTaskTag,cat:activeCat,phase,segment:newTaskSegment,ongoing:newTaskOngoing,startDate:newTaskStart||null,dueDate:newTaskDue||null}];
      setCustomTasks(next);
      doSaveCustomTasks(next);
    }
    setNewTaskText("");setAddingTask(false);setNewTaskOngoing(false);setNewTaskStart("");setNewTaskDue("");
  };

  const acceptSugg = (id)=>{
    const next=suggestions.map(s=>s.id===id?{...s,accepted:true}:s);
    setSuggestions(next);doSaveSuggestions(next);
  };
  const dismissSugg = (id)=>{
    const next=suggestions.map(s=>s.id===id?{...s,dismissed:true}:s);
    setSuggestions(next);doSaveSuggestions(next);
  };

  // ── Login ──
  if(!user) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1B1B2F 0%,#162447 40%,#1B1B2F 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Palatino Linotype','Book Antiqua',Palatino,serif",padding:24}}>
      <div style={{fontSize:56,marginBottom:20,filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.3))"}}>👣</div>
      <h1 style={{color:"#F5E6D3",fontSize:28,fontWeight:400,margin:"0 0 6px",textAlign:"center"}}>Kennedy Family Blueprint</h1>
      <p style={{color:"rgba(245,230,211,0.4)",fontSize:14,margin:"0 0 48px",fontStyle:"italic"}}>Who's checking in today?</p>
      <div style={{display:"flex",gap:24,flexWrap:"wrap",justifyContent:"center"}}>
        {[{id:"marquez",icon:"💪",label:"Marquez",sub:"Your roadmap & tasks"},{id:"jasmine",icon:"💐",label:"Jasmine",sub:"Your roadmap & tasks"}].map(u=>(
          <button key={u.id} onClick={()=>{setUser(u.id);setActiveCat("baby");setView("main");}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,padding:"34px 44px",cursor:"pointer",textAlign:"center",transition:"all 0.25s ease",minWidth:190}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.transform="translateY(-3px)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.transform="none";}}>
            <div style={{fontSize:48,marginBottom:14}}>{u.icon}</div>
            <div style={{color:"#F5E6D3",fontSize:20,fontWeight:600,fontFamily:"system-ui"}}>{u.label}</div>
            <div style={{color:"rgba(245,230,211,0.4)",fontSize:12,marginTop:6,fontFamily:"system-ui"}}>{u.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Palatino Linotype','Book Antiqua',Palatino,serif",background:"linear-gradient(155deg,#FDFAF6 0%,#FFF9F4 35%,#F4F1FA 100%)",minHeight:"100vh",color:"#2A2A2A",paddingBottom:60}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1B1B2F 0%,#162447 50%,#1B1B2F 100%)",padding:"24px 24px 20px",color:"#F5E6D3",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 20% 50%,rgba(212,135,143,0.1) 0%,transparent 50%),radial-gradient(circle at 80% 50%,rgba(106,172,191,0.08) 0%,transparent 50%)"}}/>
        <div style={{position:"relative",zIndex:1,maxWidth:820,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div>
              <div style={{fontSize:11,letterSpacing:2.5,textTransform:"uppercase",opacity:0.45}}>Kennedy Family Blueprint</div>
              <div style={{fontSize:21,fontWeight:400,marginTop:4}}>Welcome back, {myName} {user==="marquez"?"💪":"💐"}</div>
            </div>
            <button onClick={()=>setUser(null)} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(245,230,211,0.5)",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:11,fontFamily:"system-ui"}}>Switch</button>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {[{l:"Due Date",v:"Aug 1, 2026"},{l:"Countdown",v:`${weeksUntil}w ${daysUntil%7}d`},{l:"Completed",v:`${completedAll} tasks`,click:()=>setView("completed")},{l:"Due Now",v:`${focusUndone.length} tasks`,click:()=>setView("focus")}].map((b,i)=>(
              <div key={i} onClick={b.click||undefined} style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"10px 16px",flex:"1 1 100px",minWidth:100,cursor:b.click?"pointer":undefined,transition:"background 0.15s"}}
              onMouseEnter={b.click?e=>{e.currentTarget.style.background="rgba(255,255,255,0.12)";}:undefined}
              onMouseLeave={b.click?e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";}:undefined}>
                <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:1.5,opacity:0.4}}>{b.l}</div>
                <div style={{fontSize:17,fontWeight:600,fontFamily:"system-ui",marginTop:2}}>{b.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:820,margin:"0 auto",padding:"0 20px"}}>
        {/* Suggestion Banner */}
        {mySuggestions.length>0&&(
          <div style={{margin:"16px 0 0",borderRadius:12,overflow:"hidden",border:"1px solid #FFD4A0",background:"linear-gradient(135deg,#FFFAF2,#FFF6E9)"}}>
            <div style={{padding:"12px 18px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(255,159,67,0.15)"}}>
              <span style={{fontSize:22}}>✨</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,fontFamily:"system-ui",color:"#8B6914"}}>{otherName} suggested {mySuggestions.length} task{mySuggestions.length>1?"s":""} for you</div>
                <div style={{fontSize:11,color:"#B8941F",fontFamily:"system-ui"}}>Accept the ones you'd like to add</div>
              </div>
            </div>
            {mySuggestions.map(s=>(
              <div key={s.id} style={{padding:"10px 18px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid rgba(255,159,67,0.08)"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontFamily:"system-ui",color:"#444"}}>{s.text}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={()=>acceptSugg(s.id)} style={{background:"#27AE60",color:"white",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"system-ui"}}>Accept</button>
                  <button onClick={()=>dismissSugg(s.id)} style={{background:"#F0F0F0",color:"#999",border:"none",borderRadius:6,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"system-ui"}}>Skip</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Toggle */}
        <div style={{display:"flex",gap:8,margin:"18px 0 12px",flexWrap:"wrap"}}>
          {[{id:"focus",label:`🎯 Due Now (${focusUndone.length})`},{id:"main",label:"📋 Full Plan"},{id:"completed",label:`✅ Completed (${completedAll})`}].map(v=>(
            <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"9px 18px",borderRadius:20,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"system-ui",background:view===v.id?"#2A2A2A":"#F0F0F0",color:view===v.id?"white":"#888",transition:"all 0.15s ease"}}>{v.label}</button>
          ))}
        </div>

        {/* FOCUS VIEW */}
        {view==="focus"&&(
          <div style={{marginTop:8}}>
            <div style={{fontSize:13,color:"#999",fontFamily:"system-ui",marginBottom:16}}>Tasks that need your attention right now.</div>
            {focusUndone.length===0?(
              <div style={{textAlign:"center",padding:"48px 20px",color:"#CCC",fontFamily:"system-ui",fontSize:14}}>🎉 You're all caught up!</div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {focusUndone.map(t=>{
                  const fc=categories.find(c=>c.id===t._catId);
                  return (
                    <div key={t._stableKey} style={{position:"relative"}}>
                      <div style={{position:"absolute",left:0,top:12,bottom:12,width:3,borderRadius:2,background:fc?.color||"#999"}}/>
                      <div style={{marginLeft:12}}>
                        <TaskCard task={t} done={checked[t._stableKey]} onToggle={()=>toggleCheck(t._stableKey)} catColor={fc?.color||"#999"} onDelete={()=>handleDelete(t)}/>
                        <div style={{fontSize:10,color:"#BBB",fontFamily:"system-ui",marginTop:2,marginLeft:34,marginBottom:4}}>{fc?.icon} {fc?.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COMPLETED VIEW */}
        {view==="completed"&&(
          <div style={{marginTop:8}}>
            <div style={{fontSize:13,color:"#999",fontFamily:"system-ui",marginBottom:16}}>Tasks you've completed. Tap ↩ to move back to your plan.</div>
            {completedTasksList.length===0?(
              <div style={{textAlign:"center",padding:"48px 20px",color:"#CCC",fontFamily:"system-ui",fontSize:14}}>No completed tasks yet. Get started!</div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {completedTasksList.map(t=>(
                  <div key={t._stableKey} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"13px 16px",borderRadius:12,background:"#F9F9F9",border:"1px solid #EAEAEA"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,lineHeight:1.5,fontFamily:"system-ui",color:"#999",textDecoration:"line-through"}}>{t.text}</div>
                      <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
                        <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,fontFamily:"system-ui",fontWeight:600,background:t._catInfo.color+"18",color:t._catInfo.dark}}>{t._catInfo.icon} {t._catInfo.label}</span>
                        <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,fontFamily:"system-ui",fontWeight:600,background:(tagColors[t.tag]||"#999")+"15",color:tagColors[t.tag]||"#999"}}>{t.tag}</span>
                        {t.isCustom&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:4,fontFamily:"system-ui",fontWeight:600,background:"#FF9F4318",color:"#E67E22"}}>✏️ Custom</span>}
                        {t.isSuggestion&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:4,fontFamily:"system-ui",fontWeight:600,background:"#FF9F4318",color:"#E67E22"}}>✨ {t.from}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"center"}}>
                      <button onClick={()=>handleUncomplete(t._stableKey)} title="Move back to plan" style={{background:"none",border:"1px solid #DDD",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:13,color:"#888",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#27AE60";e.currentTarget.style.color="#27AE60";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#DDD";e.currentTarget.style.color="#888";}}>↩</button>
                      <button onClick={()=>handleDelete(t)} title="Delete permanently" style={{background:"none",border:"1px solid #DDD",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:13,color:"#CCC",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#E74C3C";e.currentTarget.style.color="#E74C3C";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#DDD";e.currentTarget.style.color="#CCC";}}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MAIN VIEW */}
        {view==="main"&&(<>
          {/* Category Tabs */}
          <div style={{display:"flex",gap:10,overflowX:"auto",padding:"8px 0 12px",scrollbarWidth:"none"}}>
            {categories.map(c=>{
              const active=c.id===activeCat;
              const isShared=["finance","relationship","family"].includes(c.id);
              return (
                <button key={c.id} onClick={()=>setActiveCat(c.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 16px",borderRadius:14,border:"none",cursor:"pointer",background:active?c.color+"18":"transparent",outline:active?`2px solid ${c.color}55`:"2px solid transparent",minWidth:80,transition:"all 0.15s ease"}}>
                  <span style={{fontSize:28}}>{c.icon}</span>
                  <span style={{fontSize:12,fontWeight:active?700:500,color:active?c.dark:"#888",fontFamily:"system-ui",marginTop:6,lineHeight:1.2,textAlign:"center"}}>{c.label}</span>
                  {isShared&&<span style={{fontSize:9,color:"#BBB",fontFamily:"system-ui",marginTop:2}}>shared</span>}
                </button>
              );
            })}
          </div>

          {/* Phase Toggle */}
          <div style={{display:"flex",background:"#EAEAEA",borderRadius:12,padding:3,marginBottom:16}}>
            {["before","after"].map(p=>(
              <button key={p} onClick={()=>setPhase(p)} style={{flex:1,padding:"10px 16px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"system-ui",transition:"all 0.15s",background:phase===p?"white":"transparent",color:phase===p?"#2A2A2A":"#999",boxShadow:phase===p?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>{p==="before"?"Before Kennedy":"After Kennedy"}</button>
            ))}
          </div>

          {/* Progress */}
          {cat&&(
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8,padding:"0 2px"}}>
              <div style={{flex:1,height:6,background:"#E8E8E8",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:3,transition:"width 0.4s ease",width:currentTotal>0?`${(currentDone/currentTotal)*100}%`:"0%",background:`linear-gradient(90deg,${cat.color},${cat.dark})`}}/>
              </div>
              <span style={{fontSize:12,color:"#AAA",fontFamily:"system-ui"}}>{currentDone}/{currentTotal}</span>
            </div>
          )}

          {/* Add Task */}
          <div style={{marginBottom:16}}>
            {!addingTask?(
              <button onClick={()=>{setAddingTask(true);setNewTaskFor(otherUser);setNewTaskSegment(segments[0]?.id||"now");setNewTaskOngoing(false);setNewTaskStart("");setNewTaskDue("");setNewTaskTag("Health");}} style={{width:"100%",padding:"12px 18px",borderRadius:12,border:"1px dashed rgba(0,0,0,0.13)",background:"rgba(0,0,0,0.015)",cursor:"pointer",fontSize:13,color:"#AAA",fontFamily:"system-ui",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.035)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0.015)"}
              ><span style={{fontSize:16,fontWeight:300}}>+</span> Suggest a task for {otherName} or add one for yourself</button>
            ):(
              <div style={{padding:16,borderRadius:14,background:"white",border:"1px solid #E0E0E0",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                <div style={{fontSize:14,fontWeight:700,fontFamily:"system-ui",marginBottom:12}}>Add a New Task</div>
                <input value={newTaskText} onChange={e=>setNewTaskText(e.target.value)} placeholder="What needs to be done?" autoFocus
                  style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #DDD",fontSize:14,fontFamily:"system-ui",outline:"none",boxSizing:"border-box",marginBottom:12}}
                  onFocus={e=>{if(cat) e.target.style.borderColor=cat.color;}} onBlur={e=>e.target.style.borderColor="#DDD"}
                  onKeyDown={e=>{if(e.key==="Enter") handleAddTask();}}
                />
                <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                  <div style={{flex:"1 1 130px"}}>
                    <div style={{fontSize:10,color:"#BBB",marginBottom:5,fontFamily:"system-ui",textTransform:"uppercase",letterSpacing:1}}>For</div>
                    <div style={{display:"flex",gap:5}}>
                      {[user,otherUser].map(f=>(
                        <button key={f} onClick={()=>setNewTaskFor(f)} style={{flex:1,padding:"6px 10px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"system-ui",background:newTaskFor===f?(cat?.color||"#999")+"20":"#F0F0F0",color:newTaskFor===f?(cat?.dark||"#666"):"#999",outline:newTaskFor===f?`1.5px solid ${cat?.color||"#999"}`:"none"}}>{f==="marquez"?"💪 Marquez":"💐 Jasmine"}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{flex:"1 1 140px"}}>
                    <div style={{fontSize:10,color:"#BBB",marginBottom:5,fontFamily:"system-ui",textTransform:"uppercase",letterSpacing:1}}>Tag</div>
                    <select value={newTaskTag} onChange={e=>setNewTaskTag(e.target.value)} style={{width:"100%",padding:"6px 10px",borderRadius:8,border:"1px solid #DDD",fontSize:12,fontFamily:"system-ui",background:"white",cursor:"pointer"}}>
                      {TAG_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{flex:"1 1 170px"}}>
                    <div style={{fontSize:10,color:"#BBB",marginBottom:5,fontFamily:"system-ui",textTransform:"uppercase",letterSpacing:1}}>Timeline</div>
                    <select value={newTaskSegment} onChange={e=>setNewTaskSegment(e.target.value)} style={{width:"100%",padding:"6px 10px",borderRadius:8,border:"1px solid #DDD",fontSize:12,fontFamily:"system-ui",background:"white",cursor:"pointer"}}>
                      {segments.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                </div>
                {/* Date / Ongoing */}
                <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"end"}}>
                  <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontFamily:"system-ui",fontSize:12,color:"#666"}}>
                    <input type="checkbox" checked={newTaskOngoing} onChange={e=>{setNewTaskOngoing(e.target.checked);if(e.target.checked){setNewTaskStart("");setNewTaskDue("");}}} style={{accentColor:cat?.color||"#999"}}/>🔄 Ongoing
                  </label>
                  {!newTaskOngoing&&(<>
                    <div>
                      <div style={{fontSize:10,color:"#BBB",marginBottom:4,fontFamily:"system-ui",textTransform:"uppercase",letterSpacing:1}}>Start</div>
                      <input type="date" value={newTaskStart} onChange={e=>setNewTaskStart(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid #DDD",fontSize:12,fontFamily:"system-ui"}}/>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:"#BBB",marginBottom:4,fontFamily:"system-ui",textTransform:"uppercase",letterSpacing:1}}>Due</div>
                      <input type="date" value={newTaskDue} onChange={e=>setNewTaskDue(e.target.value)} style={{padding:"5px 8px",borderRadius:8,border:"1px solid #DDD",fontSize:12,fontFamily:"system-ui"}}/>
                    </div>
                  </>)}
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <button onClick={()=>{setAddingTask(false);setNewTaskText("");}} style={{padding:"7px 16px",borderRadius:8,border:"none",background:"#EEE",color:"#999",cursor:"pointer",fontSize:12,fontFamily:"system-ui"}}>Cancel</button>
                  <button onClick={handleAddTask} disabled={!newTaskText.trim()} style={{padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"system-ui",color:"white",background:newTaskText.trim()?(cat?.color||"#999"):"#CCC",opacity:newTaskText.trim()?1:0.6}}>
                    {newTaskFor!==user?`Suggest to ${newTaskFor==="marquez"?"Marquez":"Jasmine"}`:"Add Task"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Task Groups */}
          {groupedTasks.map(group=>(
            <div key={group.id} style={{marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"0 2px"}}>
                <span style={{fontSize:20}}>{group.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,fontFamily:"system-ui",color:"#2A2A2A"}}>{group.title}</div>
                  <div style={{fontSize:11,color:"#BBB",fontFamily:"system-ui"}}>{group.subtitle}</div>
                </div>
                <div style={{fontSize:10,fontFamily:"system-ui",fontWeight:600,color:"white",background:cat?.color||"#999",borderRadius:6,padding:"3px 9px"}}>{group.targetDate}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {group.tasks.map((task)=>(
                  <TaskCard key={task._stableKey} task={task} done={checked[task._stableKey]} onToggle={()=>toggleCheck(task._stableKey)} catColor={cat?.color||"#999"} onDelete={()=>handleDelete(task)}/>
                ))}
              </div>
            </div>
          ))}
          {groupedTasks.length===0&&(<div style={{textAlign:"center",padding:"48px 20px",color:"#CCC",fontFamily:"system-ui",fontSize:14}}>No tasks in this view yet. Try adding one!</div>)}
        </>)}
      </div>
    </div>
  );
}
