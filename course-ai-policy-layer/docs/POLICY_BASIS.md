# Policy basis

This project is modeled on a real course policy, not an invented one.

## The course

**LIS 875 — Technical Foundations of Information Science**, University of Wisconsin–Madison. A graduate-level first programming course for information-science students who won't become professional programmers but need to understand how programming works and how to work with programmers. Its final project is a team project worth 40% of the grade, submitted via GitHub, asking for a thesis defended with working code the student understands and can stand behind.

Course site: https://lis875.ischool.wisc.edu

## The policy shape this models

The course's AI policy is graduated, and that's the whole reason it's a good basis — it isn't "AI banned" or "AI allowed," it's scoped by what each piece of work is protecting:

- **Prohibited** on the reflective summary+question work. The stated purpose is to load the ideas into the student's own head; AI defeats that directly, and using it there is an academic-integrity violation.
- **Held back** for the early weeks of the course, where the skill of writing the code yourself is the point.
- **Introduced and then required** in the later weeks (the course has a dedicated AI unit), because using AI as a working tool is itself a skill the course wants to teach.
- **Standing rule throughout:** any code you turn in must be code you produced, understand, can stand behind, and obtained legally.

The four rule types in `src/policy/rules.js` (allowed / reasoning-only / justify-to-exceed / prohibited) are a direct model of that graduated shape. The five-part final-project scoping in `src/policy/assignment.js` applies them the way the course's own policy would.

## Permission and scope

The author took this course. The instructor gave permission to use the course and its policy as the basis for this project.

That permission covers using the policy and course structure as the model here. It is not an endorsement of this tool, and this project is not affiliated with, supported by, or endorsed by the instructor, the iSchool, or the University of Wisconsin–Madison. No live student, roster, or submission data is used anywhere in this project; the assignment content is the public final-project description, and all interaction data in the demo is synthetic.
