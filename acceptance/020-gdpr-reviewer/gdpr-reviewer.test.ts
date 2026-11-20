import { describe, expect, it } from "vitest"
import { headings, section, sectionLines } from "../010-clarifying-questions/clarify.ts"
import { gdprTemplate, gdprText } from "./gdpr.ts"

/** The text between the first line of the file and its first level 2 heading. */
function intro(): string {
  const lines = gdprText().split(/\r?\n/)
  const end = lines.findIndex((line) => line.startsWith("## "))
  return lines.slice(1, end === -1 ? undefined : end).join("\n")
}

/** The lines of a section that start with `- ` and contain `text`. */
function findingLines(title: string, text: string): string[] {
  return sectionLines(gdprTemplate, title).filter((line) => line.startsWith("- ") && line.includes(text))
}

describe("the file templates/skills/process/gdpr-reviewer.md", () => {
  it("starts with # GDPR reviewer, has no frontmatter and no other level 1 heading, and ends with one newline", () => {
    const text = gdprText()
    expect(text.split(/\r?\n/)[0]).toBe("# GDPR reviewer")
    expect(headings(gdprTemplate, 1)).toEqual(["GDPR reviewer"])
    expect(text.endsWith("\n")).toBe(true)
    expect(/\r?\n\r?\n$/.test(text)).toBe(false)
  })

  it("has the eight level 2 headings of the spec, in order, and no others", () => {
    expect(headings(gdprTemplate, 2)).toEqual([
      "Personal data in the draft",
      "Lawful basis",
      "Data minimisation",
      "The rights of the people",
      "Notifying a breach",
      "Processor agreements",
      "What must be logged",
      "What you leave to other reviewers",
    ])
  })

  it("names reviewer.md, its findings file gdpr.md and the General Data Protection Regulation in its first paragraph", () => {
    expect(intro()).toContain("`reviewer.md`")
    expect(intro()).toContain("`gdpr.md`")
    expect(intro()).toContain("General Data Protection Regulation (GDPR)")
  })

  it("repeats no rule of reviewer.md about the findings file", () => {
    const text = gdprText()
    expect(text).not.toBe("")
    expect(text).not.toContain("Verdict:")
    expect(text).not.toContain("REVIEWED")
    expect(text.split(/\r?\n/).filter((line) => line.startsWith("- ["))).toEqual([])
  })
})

describe("the section Personal data in the draft of the GDPR reviewer", () => {
  it("takes what a system holds and which agreements exist only from the organisation context", () => {
    const text = section(gdprTemplate, "Personal data in the draft")
    expect(text).toContain("What a system holds and who supplies it is what `organisation/systems.md` says.")
    expect(text).toContain("Which agreements the organisation has is what `organisation/processors.md` says.")
    expect(text).toContain("Take no such fact from anywhere else.")
  })

  it("makes the reviewer name the article in a finding and have no finding for a draft without personal data", () => {
    const text = section(gdprTemplate, "Personal data in the draft")
    expect(text).toContain("Name the article in the finding.")
    expect(text).toContain("When no part of the draft handles personal data, you have no finding.")
  })
})

describe("the section Lawful basis of the GDPR reviewer", () => {
  it("names Articles 6, 7 and 9, the six bases and the section Legal basis of spec.md as their source", () => {
    const text = section(gdprTemplate, "Lawful basis")
    expect(text).toContain("Articles 6, 7 and 9")
    expect(text).toContain("consent, a contract with the person, a legal obligation, vital interests, a task in the public interest or legitimate interests")
    expect(text).toContain("The basis is what the section `Legal basis` of `spec.md` gives.")
    expect(text).toContain("special category of Article 9")
  })

  it("never asks the draft for a heading for the legal basis", () => {
    expect(section(gdprTemplate, "Lawful basis")).toContain("Never ask for one")
  })
})

describe("the section Data minimisation of the GDPR reviewer", () => {
  it("names Article 5, the data a step needs and how long a record is kept", () => {
    const text = section(gdprTemplate, "Data minimisation")
    expect(text).toContain("Article 5")
    expect(text).toContain("only the personal data it needs")
    expect(text).toContain("Name the data that is not needed.")
    expect(text).toContain("how long every record that holds personal data is kept")
  })
})

describe("the section The rights of the people of the GDPR reviewer", () => {
  it("names Articles 12 to 22, that the person is told, and the one month to answer a request", () => {
    const text = section(gdprTemplate, "The rights of the people")
    expect(text).toContain("Articles 12 to 22")
    expect(text).toContain("the person is told what is collected and why")
    expect(text).toContain("at most one month from the day the request came in")
  })

  it("tags a decision an AI alone makes about a person high", () => {
    const lines = findingLines("The rights of the people", "A step in which an AI alone makes a decision that has a legal effect on a person")
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain("tagged `high`")
  })
})

describe("the section Notifying a breach of the GDPR reviewer", () => {
  it("names Articles 33 and 34, the 72 hours from when the organisation learned of the breach, and telling the people", () => {
    const text = section(gdprTemplate, "Notifying a breach")
    expect(text).toContain("Articles 33 and 34")
    expect(text).toContain("at the latest 72 hours after the organisation learned of the breach")
    expect(text).toContain("counts the deadline from a later moment")
    expect(text).toContain("The people are told without undue delay when the risk for them is high.")
  })

  it("gives the tag high in exactly two lines: the notification of the authority and the telling of the people", () => {
    expect(findingLines("Notifying a breach", "`high`")).toHaveLength(2)
    expect(findingLines("Notifying a breach", "72 hours")[0]).toContain("`high`")
    expect(findingLines("Notifying a breach", "The people are told")[0]).toContain("`high`")
  })
})

describe("the section Processor agreements of the GDPR reviewer", () => {
  it("names Article 28 and goes through every system the draft names", () => {
    const text = section(gdprTemplate, "Processor agreements")
    expect(text).toContain("Article 28")
    expect(text).toContain("Go through every system the draft names.")
  })

  it("tags a system that has no section in organisation/systems.md medium", () => {
    const lines = findingLines("Processor agreements", "A system that has no section in")
    expect(lines).toHaveLength(1)
    expect(lines[0]?.startsWith("- A system that has no section in `organisation/systems.md`")).toBe(true)
    expect(lines[0]).toContain("`medium`")
  })

  it("tags a system with personal data and an outside supplier but no agreement in organisation/processors.md high", () => {
    const lines = findingLines("Processor agreements", "must have a section with an agreement that covers that system")
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain("`organisation/processors.md`")
    expect(lines[0]).toContain("`high`")
    expect(lines[0]).toContain("Name the system and the supplier")
    expect(lines[0]).toContain("missing from the organisation context, not from the draft")
  })
})

describe("the section What must be logged of the GDPR reviewer", () => {
  it("names Articles 5, 7 and 33 and the records of a breach, a decision not to notify, a consent and where they are kept", () => {
    const text = section(gdprTemplate, "What must be logged")
    expect(text).toContain("Articles 5, 7 and 33")
    expect(text).toContain("Every personal data breach is recorded, also one that is not notified")
    expect(text).toContain("A decision not to notify the data protection authority or the people is recorded with its reason.")
    expect(text).toContain("the consent is recorded")
    expect(text).toContain("the draft says where it is kept")
  })
})

describe("the section What you leave to other reviewers of the GDPR reviewer", () => {
  it("leaves other laws, authority, steps without personal data and the cases to other reviewers", () => {
    const text = section(gdprTemplate, "What you leave to other reviewers")
    expect(text).toContain("A law, an agreement or a policy other than the GDPR")
    expect(text).toContain("`organisation/authority.md`")
    expect(text).toContain("The legal basis of a step that handles no personal data.")
    expect(text).toContain("You read no case.")
  })
})
