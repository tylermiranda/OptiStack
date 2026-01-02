import{c as d,h as w,u as O,r as o,j as e,i as j,k as C}from"./index-DRZdevS_.js";/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=d("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=d("Brain",[["path",{d:"M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z",key:"1mhkh5"}],["path",{d:"M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z",key:"1d6s00"}]]);/**
 * @license lucide-react v0.300.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=d("CheckCircle",[["path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14",key:"g774vq"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]),M=({supplements:r})=>{var u,y;const{settings:m}=w(),{token:k}=O(),[i,h]=o.useState(null),[g,p]=o.useState(!1),[x,f]=o.useState(null),N=async()=>{p(!0),f(null);const n=r.filter(s=>{var t;return(t=s.schedule)==null?void 0:t.am}).map(s=>`${s.name} (${s.schedule.amPills||1} pills)`),a=r.filter(s=>{var t;return(t=s.schedule)==null?void 0:t.pm}).map(s=>`${s.name} (${s.schedule.pmPills||1} pills)`),b=r.filter(s=>{var t,l;return!((t=s.schedule)!=null&&t.am)&&!((l=s.schedule)!=null&&l.pm)}).map(s=>s.name),v=`
            Analyze this daily supplement protocol:
            
            MORNING PROTOCOL:
            ${n.length>0?n.join(", "):"None"}
            
            NIGHT PROTOCOL:
            ${a.length>0?a.join(", "):"None"}
            
            OTHER SUPPLEMENTS (No specific time):
            ${b.length>0?b.join(", "):"None"}
            
            Please provide a comprehensive analysis in JSON format with the following keys:
            - "benefits": (Array of strings) Key expected health benefits of this specific combination.
            - "synergies": (Array of strings) How these specific supplements work well together (e.g. Vit D and Magnesium).
            - "potential_risks": (Array of strings) Negative interactions or timing issues (e.g. taking energizing things at night).
            - "summary": (String) A 2-3 sentence overall assessment of this stack's goal and effectiveness.
        `,A=m.aiModel;try{const s=await fetch("/api/ai/analyze",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${k}`},body:JSON.stringify({model:A,prompt:v})});if(!s.ok)throw new Error("Analysis failed");const z=(await s.json()).choices[0].message.content.replace(/```json/g,"").replace(/```/g,"").trim(),S=JSON.parse(z);h(S)}catch(s){console.error(s),f("Failed to generate analysis. Please try again.")}finally{p(!1)}};return r.length===0||!m.aiEnabled?null:e.jsxs("section",{className:"mt-12 mb-12",children:[e.jsxs("div",{className:"flex items-center justify-between mb-6",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(P,{size:24,className:"text-primary"}),e.jsx("h2",{className:"text-2xl font-bold tracking-tight",children:"AI Stack Analysis"})]}),!i&&e.jsxs("button",{onClick:N,disabled:g,className:"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2",children:[e.jsx(j,{size:16,className:"mr-2"}),g?"Analyzing Protocol...":"Analyze Full Stack"]})]}),x&&e.jsx("div",{className:"p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 mb-6",children:x}),i&&e.jsxs("div",{className:"rounded-xl border bg-card text-card-foreground shadow-sm p-8 animate-fade-in",children:[e.jsxs("p",{className:"text-lg leading-relaxed mb-8 text-foreground italic border-l-4 border-primary pl-4",children:['"',i.summary,'"']}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-8",children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"flex items-center gap-2 text-green-600 font-semibold mb-4",children:[e.jsx(E,{size:20})," Expected Benefits"]}),e.jsx("ul",{className:"space-y-2",children:(u=i.benefits)==null?void 0:u.map((n,a)=>e.jsxs("li",{className:"flex gap-2 text-sm text-muted-foreground items-start",children:[e.jsx(c,{size:16,className:"mt-0.5 text-border shrink-0"}),e.jsx("span",{children:n})]},a))})]}),e.jsxs("div",{children:[e.jsxs("h3",{className:"flex items-center gap-2 text-primary font-semibold mb-4",children:[e.jsx(j,{size:20})," Synergies"]}),e.jsx("ul",{className:"space-y-2",children:(y=i.synergies)==null?void 0:y.map((n,a)=>e.jsxs("li",{className:"flex gap-2 text-sm text-muted-foreground items-start",children:[e.jsx(c,{size:16,className:"mt-0.5 text-border shrink-0"}),e.jsx("span",{children:n})]},a))})]}),i.potential_risks&&i.potential_risks.length>0&&e.jsxs("div",{children:[e.jsxs("h3",{className:"flex items-center gap-2 text-destructive font-semibold mb-4",children:[e.jsx(C,{size:20})," Things to Watch"]}),e.jsx("ul",{className:"space-y-2",children:i.potential_risks.map((n,a)=>e.jsxs("li",{className:"flex gap-2 text-sm text-muted-foreground items-start",children:[e.jsx(c,{size:16,className:"mt-0.5 text-border shrink-0"}),e.jsx("span",{children:n})]},a))})]})]}),e.jsx("button",{onClick:()=>h(null),className:"mt-8 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2",children:"Close Analysis"})]})]})};export{M as default};
