/* Every spoken line in the game. Single source of truth for the game AND the recorder tool.
   Record each line with tools/recorder.html -> saved as audio/<id>.m4a.
   Any line without a recording falls back to the phone's built-in voice. */
(function(g){
  const P=[];
  const add=(id,text,cat)=>P.push({id,text,cat});
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

  /* ---- numbers (the game stitches these together: "three hundred and forty five") ---- */
  const ONES=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
  ONES.forEach((w,i)=>add('n'+i,cap(w),'1 Numbers'));
  [['30','thirty'],['40','forty'],['50','fifty'],['60','sixty'],['70','seventy'],['80','eighty'],['90','ninety']].forEach(a=>add('n'+a[0],cap(a[1]),'1 Numbers'));
  add('hundred','Hundred','1 Numbers');add('and','And','1 Numbers');
  add('plus','Plus','1 Numbers');add('minus','Take away','1 Numbers');add('equals','Equals','1 Numbers');add('altogether','How many altogether?','1 Numbers');
  add('stars','Stars!','1 Numbers');add('you_have','You have','1 Numbers');add('you_caught','You caught','1 Numbers');

  /* ---- shapes ---- */
  const SHAPES=['circle','square','triangle','star','heart','diamond','rectangle','oval'];
  SHAPES.forEach(s=>add(s,cap(s)+'!','2 Shapes'));
  add('sides3','A triangle has three sides!','2 Shapes');add('sides4','A square has four sides!','2 Shapes');add('round','A circle is round!','2 Shapes');

  /* ---- colours ---- */
  ['red','blue','yellow','green','pink','purple','orange'].forEach(c=>add(c,cap(c)+'!','3 Colours'));

  /* ---- little connecting phrases ---- */
  add('tap_the','Tap the','4 Prompts');add('find_the','Find the','4 Prompts');add('pop_the','Pop the','4 Prompts');add('trace_the','Trace the','4 Prompts');
  add('give_me','Give me','4 Prompts');add('i_need','I need','4 Prompts');add('how_many','How many?','4 Prompts');add('how_many_do','How many do you see?','4 Prompts');
  add('pop_number','Pop the number','4 Prompts');add('whats_next','What comes next?','4 Prompts');add('drag_home','Put each shape in its home!','4 Prompts');
  add('lets_count','Let us count!','4 Prompts');add('tap_to_count','Tap each one to count!','4 Prompts');add('make_pairs','Find the matching pairs!','4 Prompts');
  add('build_it','Build it with shapes!','4 Prompts');add('trace_it','Trace it with your finger!','4 Prompts');add('put_in_order','Put the numbers in order!','4 Prompts');
  add('lets_add','Let us add!','4 Prompts');add('drag_plate','Drag them to the plate!','4 Prompts');add('what_play','What shall we play?','4 Prompts');
  add('times','times!','4 Prompts');add('tap_heart','Tap the heart!','4 Prompts');

  /* ---- things to count ---- */
  ['apples','carrots','cookies','fish','bananas','stars_item','flowers','butterflies','pills','bandages'].forEach(w=>add('i_'+w,w==='stars_item'?'stars':cap(w),'5 Things to count'));

  /* ---- praise & feelings ---- */
  [['yes','Yes!'],['great_job','Great job!'],['got_it','You got it!'],['super','Super!'],['try_again','Try again!'],['wow','Wow!'],['well_done','Well done!'],['hooray','Hooray!'],
   ['too_many','Oops, that is too many!'],['not_enough','We need a few more!'],['perfect','Perfect!'],['so_close','So close! Try again!'],['you_win','You win! You are the fastest!'],
   ['new_sticker','You got a new sticker!'],['all_stickers','Look at all your stickers!'],['smart','You are so smart!'],['clever','What a clever thing!'],['thank_you','Thank you!']]
   .forEach(a=>add(a[0],a[1],'6 Praise'));

  /* ---- Dr. Unicorn clinic ---- */
  [['clinic_hello','Doctor time! Someone needs our help!'],['not_well','Oh no, I do not feel well!'],['feel_better','I feel all better! Thank you!'],
   ['need_bandage','I need a bandage'],['listen_heart','Listen to my heart!'],['open_wide','Say aah!'],['check_temp','Let us check the temperature!']]
   .forEach(a=>add(a[0],a[1],'7 Clinic'));

  /* ---- friends' names ---- */
  ['Biscuit','Sparkle','Pip','Daisy','Mochi','Peanut','Luna','Buttons','Waffles','Tinkle','Bubbles','Coco','Pumpkin','Sunny'].forEach(n=>add('name_'+n.toLowerCase(),n+'!','8 Friends'));
  add('is_so_happy','is so happy!','8 Friends');

  /* ---- magic land world ---- */
  [['u_unicorn',"You're a unicorn!"],['u_princess',"You're a princess!"],['rainbow_dash','Rainbow dash!'],['magic_bloom','Magic bloom!'],['royal_party','Royal party!'],['wheee','Wheee!'],
   ['castle_welcome','Welcome to the castle! Time to dress up!'],['look_beautiful','You look beautiful!'],['so_pretty','So pretty!'],['starting_over','Starting over!'],
   ['build_tap','Tap to build! Tap the trash can to take things away.'],['friend_first','Make a friend first!'],['paint_on','Paint on! Walk to paint!'],['paint_off','Paint off'],['dance_party','Dance party!'],
   ['hiding','I am hiding! Can you find me? Follow the arrow!'],['found_me','You found me! Hooray!'],['race_castle','Race to the castle! Go through the gates!'],['go','Go!'],
   ['tap_falling','Tap the falling stars!'],['cave_wow','Wow, a treasure cave! Tap the sparkly rocks!'],['found_treasure','You found all the treasure!'],['whoosh','Whoosh!'],
   ['raining','It is raining! Splash in the puddles!'],['snowing','Look, it is snowing!'],['rainbow_look','Look, a rainbow!'],['you_did_it','You did it! Great job!'],
   ['yum','Yum yum!'],['splash','Splash splash!'],['pretty_pet','So pretty!'],['love_you','Aww, I love you!'],['hooray_stars','Hooray! Hooray!']]
   .forEach(a=>add(a[0],a[1],'9 Magic Land'));

  /* ---- quests ---- */
  [['Pick three flowers!'],['Pick five flowers!'],['Find two red flowers!'],['Find two yellow flowers!'],['Find two tulips!'],['Find three pink flowers!'],['Catch two floating stars!'],['Catch two butterflies!'],
   ['Make a new friend!'],['Make two new friends!'],['Shake an apple tree!'],['Go splash in the pond!'],['Walk under the rainbow!'],['Go to the castle for a party!'],['Take a ride on the carousel!'],
   ['Dance on three sparkly pads!'],['Find a magic door!'],['Find the treasure cave!'],['Go dress up in the castle!'],['Take care of a friend!'],['Play a game!'],['Build two things in your garden!'],
   ['Go and play a learning game!'],['Paint with your magic!']].forEach((a,i)=>add('quest'+i,a[0],'A Quests'));

  /* ---- colouring ---- */
  [['draw_time','Draw anything you like!'],['colour_time','Pick a colour and tap to fill!'],['photo_time','Choose a photo to colour in!'],['saved_pic','I saved your picture!'],
   ['cat_dino','Dinosaurs!'],['cat_animals','Animals!'],['cat_mermaid','Mermaids!'],['cat_magic','Unicorns!'],['cat_ocean','Ocean!'],['cat_space','Space!'],['cat_vehicles','Vehicles!'],['cat_garden','Garden!']]
   .forEach(a=>add(a[0],a[1],'B Colouring'));

  const norm=t=>String(t).toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  g.PHRASES=P;
  g.PHRASE_BY_TEXT=Object.fromEntries(P.map(p=>[norm(p.text),p.id]));
  g.phraseNorm=norm;
  g.SHAPE_NAMES=SHAPES;
})(typeof window!=='undefined'?window:globalThis);
