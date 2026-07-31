---
marp: true
theme: default
paginate: true
publish: false
---
# Keep Your AI Where I Can See It 

<br><br><br><br><br><br><br><br><br><br>

	 Peter's Notes On Leveling Up An AI Practice

# Peter's Takes - Appendix D Has Detail

- USC Accounts
- Frontier vs Chinese LLMs
- LLM Settings - Model; Effort
- Perplexity
- Best Practices

# My Guiding Question

### *When I use AI, am I thinking more or less?*

# Browser chat is opaque, making it easy to hand our thinking over to the LLM.{bg:#333333}

<p style="text-align:center">![[ChatGPT_Chat.png|800]]</p>

<br>

#### If our students are mostly doing browser chatting, they're behind.

# Three Surfaces {bg:#100e17}

<p style="text-align:center;max-width:none;margin-bottom:0">![[claude_chat_cowork.png|500]] ![[claude_code.png|500]]</p>





## Chat Requires Context to Be Rebuilt

![[PromptExample.png|900]]

<br>

### What is possible if you give it astonishingly more context? 

# To What End?

<br>

### Claude, ChatGPT, etc are black boxes we can't train or read.  
<br>


### *What if you could shape an LLM around your needs, refine it over time, and share it with others?*<br><br>





---
# Codex and Claude Code Are Inside Your Workspace {.image-right bg:#100e17}

<p>![[perforce1.png|420]]</p>

### “Workspace” already means something to us:

- A local Unity or Unreal project
- Persistent between work sessions, and collaborators


# Frontier Labs' Focus

####  Software Teams Add Agents Inside Their Workspace



## I’m using agents in a persistent workspace, but for knowledge work {bg:#100e17}
<br>
<p>![[ObsidianWide.png|900]]</p>




## The LLM and I have the same connection to the content.  


# The Guiding Question

### *When I use AI, am I thinking more or less?*

<br><br>

#### About what matters:

- New ideas
- Meaningful choices
- Interpretation and uncertainty
- Creative conviction - our best ideas happen when our minds are disconnected from AI.
	- *this slide is just as much for engineers as anyone*

---

# GD Office Hours is my working example.

# GDOH turns my course material into an AI guide that walks a student from a nascent game idea to a build order they carry out themselves in Unreal.

# Nothing {.notitle bg:#aaaaaa .big}

- Turned all my teaching materials - slides, notes, lessons, assignments - into a "knowledge bundle"
- A kind of wiki formatted for people and LLMs alike
- More recently formalized by:

	- Andrej Karpathy - https://medium.com/@urvvil08/andrej-karpathys-llm-wiki-create-your-own-knowledge-base-8779014accd5
	- Google - https://www.mejba.me/blog/google-open-knowledge-format-okf-explained
	

## Online Version

![[web-gdoh-screenshot.png|800]]


## But Its Best Version Is A Corpus of Markdown Files {bg:#100e17}

![[obsidianScreenshot1.png|800]]!


# GitHub Makes the Corpus Versioned and Shareable {bg:#100e17}

![[obsidianScreenshot2.png|850]]


# In Context Learning {bg:#000000}

![[LLMtoICL.png|950]]


---

# GDOH Has Two Parts

- **Knowledge Bundle**
	- **Course content** — storytelling and worldbuilding concepts, terms, definitions, and explanations
	- **Unreal** — tutorials and a practical wiki
	- **References** — curated game and film examples
- **Agent Specification**
	- ***Recorded Examples*** —  of productive conversations
	- ***Instructions*** — how to speak with the student (e.g. refuses to generate ideas)
	- ***LLM-agnostic*** — works with many models

<br><br>

Appendix B comments on terminology. 
# Instructions  {bg:#000000} 

![[GDOH_Instructions.png|1000]]


----
# Before The Prototype - A 10 Minute Conversation

- Clarify the idea
- Discusses the way Peter does
- Surfaces unknown unknowns 
- Connects to course material 
- Returns a document for us


---

## Concludes With a Reviewable Artifact {bg:#100e17}

![[projectOutputExample0.png|760]]


## Asks Questions.  Cautious with Suggestions. {bg:#100e17}

![[projectOutputExample.png|720]]


## For A Prototype, It Offers An Achievable Build Order {bg:#100e17}

![[projectOutputExample2.png|760]]


## Learning on the Internet is Chaos Inside an Infinity {bg:#100e17}

![[projectOutputExample3.png|760]]


---




# Subsequent Conversation With Peter

- The discussion focused on ideas and unknowns
- English learners spoke with more confidence and clarity
- The student still owned the important decisions
- The next artifact was stronger: the students drafted excellent macros


----
# Nothing {.notitle bg:#aaaaaa}

### And so.

### At the same time. 

### Game engines are changing.


# Unity

- Command line does a ton 
- In terms of AI integration, it is ahead
- Unity games can be islands in Fortnite

# Unreal 6.0

- Rolling out 2027 - 2029.  
- Blueprints scripting is going away
- Verse is the new language
- "Entities" (things in the scene) will be defined differently
  
- Let's embrace experimental features


---

## Back To The Topic - The Value of Persistent, Shared, Knowledge Workspaces

- Starting next year, there will be a lot of us learning Unreal 6.0 in parallel
---

# Ignore {.notitle bg:#aaaaaa .big}


The End

# Appendix A: Next Step, Peter

<br>

### In my class, they will ***branch*** GD Office Hours into their own version - that teams shape towards their wants and needs.  

<br><br>

### For teams all design and development documents, meeting notes, research, examples, build iteration details, playtest notes, calendars, and difference of opinions are in their LLM's head, ready to access.  And all of that ***context and memory*** is readable and writable - to the humans - in a central, shared place.  








# Appendix B

The GDOH is an example of what?  Give me the concise term.<br>
It is 
- *a full knowledge bundle plus a behavior spec, packaged as one distributable unit that turns a generic coding agent into a specific one via in-context learning.*

<br><br>

<p style="font-size:1em">If you have a shorter term for me, please share.</p>
# Appendix C: Browser Chat vs Persistent Workspace {.tall}

| Browser chat | Persistent workspace |
|---|---|
| Produces an answer | Produces durable work |
| Context is supplied temporarily | Context persists in project files |
| Memory is largely service-controlled | Project memory can live in team-controlled files |
| Suggests what someone might do | Reads, writes, uses tools, and checks its work |
| Share a transcript | Share files, diffs, and review |
| Improve the prompt | Improve the corpus, instructions, and workflow |
| Conversation history | Version history |




<br>



# Appendix D: Peter's Quick Takes (Let's Discuss) {.tall}

- USC Accounts 
	- Have privacy but weak model "effort" options
	- Can't do CLIs - *agents in a persistent workspace* - that I'm arguing for in this slideshow
- LLMs Have Compute Levels, "effort".  Productively toggling among them is a learned skill<br>
	![[ClaudeModels.png|270]]&nbsp;&nbsp;&nbsp;&nbsp;![[ClaudeEfforts.png|330]]&nbsp;&nbsp;&nbsp;&nbsp;![[CodexModels.png|400]]
- U.S. Frontier Models
	- Claude and Codex are peers.  Gemini is right there with them
	- Their "CLIs" are Claude Code, (ChatGPT's) Codex , and (Gemini/Google's) Antigravity 
	- The default CLI is the terminal.  For the Chinese models I've used, the terminal is the only choice
	- Peter pays for - Claude, Codex, Gemini, Perplexity, Deepseek (per token)
	- OpenAI just announced pay as you go cheap for their modest models.  But only for the API, likely not useful
	- Get to know Claude's "Plan Mode"
	- Google:  Google search, AI Mode, and Gemini are not the same thing
- Chinese LLMs. ***Our Chinese students use these.*** 
	- Deepseek, Qwen, Kimi, etc compete with U.S. models and are cheap.  
	- Often can be downloaded for privacy and control.  So can Meta's (Llama).
- Perplexity 
	- Handy for researching AI itself as it's functionally unbiased 
	- Broader search too: $20/month for best alternative - ever - to Google search
- Popular - Obsidian, VS Code, GitHub
- Tokens and Context - learn how to conserve  
 ![[claude_tokenwatch.png|400]]
- Ask your LLM to respond with an html page - easier to read helps Guiding Question, above
