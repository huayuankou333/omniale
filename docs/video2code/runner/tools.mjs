const obj=properties=>({type:'object',properties,additionalProperties:false});
const string={type:'string'},number={type:'number'};
const tool=(name,description,properties,required=[])=>({type:'function',name,description,strict:false,parameters:{...obj(properties),required}});
export const TOOLS=[
 tool('list_files','List your own project files. No evaluator or host access.',{}),
 tool('read_file','Read a text file from your project or public TASK.md. Local three vendor modules may be read by relative vendor paths.',{path:string},['path']),
 tool('write_files','Create/replace front-end project files. Only relative HTML/CSS/JS/JSON/SVG/README files. package.json, server.mjs, vendor are read-only. No server-side code executes.',{files:{type:'array',items:{...obj({path:string,content:string}),required:['path','content']}}},['files']),
 tool('run_command','Trusted operations only: serve starts/reloads your page, check runs syntax parsing on your JS (without executing it), reload refreshes. No arbitrary shell commands.',{command:{type:'string',enum:['serve','check','reload']}},['command']),
 tool('video_frames','Extract exact reference video frames. Returns raw images. Up to 12 times per call; optional crop x,y,width,height. Each frame counts, even cached. Duration 41.333s.',{seconds:{type:'array',items:number},crop:{type:'array',items:number}},['seconds']),
 tool('inspect_own_page','Return an actual screenshot, visible controls with bounding boxes, and browser error logs. Counts one own-page frame.',{}),
 tool('browser_action','Perform up to 20 mouse/keyboard/select/wait actions, then return screenshot and controls. Coordinates are viewport pixels (1280x804); select index refers to visible selects.',{actions:{type:'array',items:{...obj({type:{type:'string',enum:['click','move','drag','key','text','select','wait']},x:number,y:number,to_x:number,to_y:number,button:{type:'string',enum:['left','middle','right']},key:string,text:string,index:number,value:string,ms:number,steps:number}),required:['type']}}},['actions'])
];
