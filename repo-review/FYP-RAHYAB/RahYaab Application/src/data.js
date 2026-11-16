export const RQ=[['R','Fix or build things with tools'],['R','Work with machines or electronics'],['R','Spend time outdoors with animals or plants'],['R','Repair a bike, phone or gadget'],
['I','Do science experiments'],['I','Solve tricky maths problems'],['I','Research how things work'],['I','Look for patterns in data'],
['A','Draw, paint or design things'],['A','Write stories or poems'],['A','Make music or videos'],['A','Act or perform on stage'],
['S','Help classmates with their problems'],['S','Teach younger children'],['S','Volunteer in your community'],['S','Listen to people who feel worried'],
['E','Lead a team or club'],['E','Start a small business'],['E','Convince others of your idea'],['E','Organise an event'],
['C','Keep records neat and organised'],['C','Work with numbers and tables'],['C','Follow clear step-by-step rules'],['C','Plan schedules and budgets']];
// [field, RIASEC code (main letters first), ideal Big Five O C E A N (1 low, 2 mid, 3 high), skills in priority order]
export const FIELDS=[
['Software Engineering','IRC','32221',['Programming basics (Python or JavaScript)','Logical problem solving','Maths for computing','Building small projects']],
['Data Science and AI','ICR','33121',['Statistics and probability','Python for data','Spreadsheets and charts','Asking good questions from data']],
['Medicine and Healthcare','ISR','23231',['Biology and chemistry foundations','Talking with patients','Study habits for entry tests','Teamwork and first aid']],
['Engineering (Mechanical and Electrical)','RIC','23221',['Physics and maths','Technical drawing','Hands-on workshop practice','Basic electronics']],
['Architecture and Design','AIR','32222',['Sketching and drawing','Design software basics','Visual thinking and 3D shapes','Building a portfolio']],
['Business and Entrepreneurship','ECS','33321',['Communication and presenting','Money and budgeting basics','Leading a team project','Spotting customer problems']],
['Accounting and Finance','CEI','13221',['Maths and accounting basics','Spreadsheets','Attention to detail','How businesses earn money']],
['Teaching and Education','SAE','22331',['Explaining ideas clearly','Patience and listening','Strong subject knowledge','Mentoring younger students']],
['Psychology and Counselling','SIA','32231',['Active listening','Understanding behaviour','Research and writing','Managing stress']],
['Law and Public Policy','EIS','23321',['Reading and writing','Debate and public speaking','Critical thinking','Following current affairs']],
['Media and Communication','AES','32322',['Writing and storytelling','Photo and video basics','Public speaking','Social media know-how']]];
export const RN={R:'Realistic (hands-on)',I:'Investigative (thinking)',A:'Artistic (creative)',S:'Social (helping)',E:'Enterprising (leading)',C:'Conventional (organising)'};
export const BFN={O:'Openness',C:'Conscientiousness',E:'Extraversion',A:'Agreeableness',N:'Neuroticism (stress sensitivity)'};
export const LV=['Not at all','A little','Somewhat','Quite a bit','Very much'];
export const FACES=[['😀','Happy'],['😢','Sad'],['😠','Angry'],['😨','Scared'],['😲','Surprised'],['🤢','Disgusted']];
// [story, options, score per option: 2 = best, 1 = okay, 0 = poor]
export const STORIES=[
['Your friend did not make the team that you got into. You…',['Say it is no big deal and talk about your day','Tell them you are sorry and ask how they feel','Avoid them for a few days'],[1,2,0]],
['You get a low mark and feel really angry. You…',['Take a few deep breaths, then ask the teacher how to improve','Throw your book and shout','Say you do not care at all'],[2,0,1]],
['A group member keeps ignoring your ideas. You…',['Stay silent and feel upset','Calmly say you would like your ideas heard too','Take over the whole project'],[0,2,1]],
['A classmate is crying after a bad day. You…',['Sit nearby and offer to listen','Tell them to stop crying','Make jokes to cheer them up'],[2,0,1]]];
