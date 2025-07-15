import { Disclosure } from "@headlessui/react"
import { ChevronUpIcon } from "@heroicons/react/20/solid"

export default function HowToPlay() {
  return (
    <div className="min-h-screen px-4 py-10 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center">How to Play</h1>

        {/* Sections */}
        <Section title="Objective">
          Your goal is to pick one NFL team each week that you think will win their game. However, you can only pick each team <strong>once</strong> during the regular season. Join a group of up to 10 friends and show off your football smarts!
        </Section>

        <Section title="Rules">
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-200">
            <li>Pick <strong>one</strong> NFL team each week to win their game.</li>
            <li>If your team wins, you earn points. If they lose, you get none.</li>
            <li>Whether they win or lose, once you've picked a team, you can't pick them again.</li>
            <li>Your points depend on how many other players picked the same team. For more, see the scoring table.</li>
            <li>Make sure you submit your pick before the deadline. More details below.</li>
          </ul>
        </Section>

        <Section title="Scoring">
          <p className="mb-4">
            You earn more points when fewer players in your group choose the same team as you. Here's how many points you'll get <strong>if your team wins</strong>:
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-300 border border-gray-600 rounded-lg">
              <thead className="bg-white/10 text-gray-200">
                <tr>
                  <th className="px-4 py-2 border-b border-gray-600">Group Size</th>
                  <th className="px-4 py-2 border-b border-gray-600">4&lt; Players</th>
                  <th className="px-4 py-2 border-b border-gray-600">4-5 Players</th>
                  <th className="px-4 py-2 border-b border-gray-600">6-7 Players</th>
                  <th className="px-4 py-2 border-b border-gray-600">8-10 Players</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="px-4 py-2 font-medium">Only you picked the team</td>
                  <td className="px-4 py-2">10</td>
                  <td className="px-4 py-2">10</td>
                  <td className="px-4 py-2">10</td>
                  <td className="px-4 py-2">10</td>
                </tr>
                <tr className="bg-white/5">
                  <td className="px-4 py-2 font-medium">2 players picked the team</td>
                  <td className="px-4 py-2">6</td>
                  <td className="px-4 py-2">7</td>
                  <td className="px-4 py-2">8</td>
                  <td className="px-4 py-2">9</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">3 players picked the team</td>
                  <td className="px-4 py-2">4</td>
                  <td className="px-4 py-2">5</td>
                  <td className="px-4 py-2">6</td>
                  <td className="px-4 py-2">7</td>
                </tr>
                <tr className="bg-white/5">
                  <td className="px-4 py-2 font-medium">4 players picked the team</td>
                  <td className="px-4 py-2">-</td>
                  <td className="px-4 py-2">3</td>
                  <td className="px-4 py-2">5</td>
                  <td className="px-4 py-2">6</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">5+ players picked the team</td>
                  <td className="px-4 py-2">-</td>
                  <td className="px-4 py-2">2</td>
                  <td className="px-4 py-2">4</td>
                  <td className="px-4 py-2">5</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Pick Deadlines & Submitting Your Pick">
          <div className="space-y-4 text-sm text-gray-200">
            <p>
              Each game has its own pick deadline, which is <strong>30 minutes before kickoff</strong>.
              For example:
              <ul className="list-disc list-inside">
                <li>1:00 PM game → deadline is 12:30 PM</li>
                <li>8:20 PM game → deadline is 7:50 PM</li>
              </ul>
            </p>
            <p>
              To submit your pick, go to your group page and select a team. You can edit your pick up until the deadline. Once it passes, your pick is locked.
            </p>
            <p>
              If a game's deadline has passed, it will no longer be available. So if the Sunday afternoon games have started and you haven't picked yet, you'll only be able to choose from the Sunday night or Monday night games—assuming you haven't already used those teams.
            </p>
            <p>
              If you <strong>don't</strong> submit a pick for the week, you'll get 0 points but won't lose access to any teams.
            </p>
            <p className="text-xs text-gray-400 italic">
              Note: Deadlines may shift for special games, like Thanksgiving, Christmas, or if a game is rescheduled.
            </p>
          </div>
        </Section>

        {/* FAQ */}
        <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md shadow-lg space-y-4">
          <h2 className="text-2xl font-semibold text-white">FAQs</h2>
          <div className="space-y-2">
            {faqItems.map((item, index) => (
              <Disclosure key={index}>
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex justify-between w-full px-4 py-3 text-left text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 transition">
                      <span>{item.question}</span>
                      <ChevronUpIcon
                        className={`${
                          open ? "rotate-180 transform" : ""
                        } h-5 w-5 text-white`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-4 pt-2 pb-4 text-sm text-gray-300">
                      {item.answer}
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            ))}
          </div>
        </div>

        <div className="text-center pt-8">
          <p className="text-sm text-gray-400 italic">
            Ready to begin? Head back to the dashboard and start your game!
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md shadow-lg space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="text-sm text-gray-200">{children}</div>
    </div>
  )
}

const faqItems = [
  {
    question: "Is Pick 'Em only during the regular season?",
    answer: "Yes, for now Pick 'Em is only available during Weeks 1 through 18 of the NFL regular season. We may expand to include playoffs in the future.",
  },
]
