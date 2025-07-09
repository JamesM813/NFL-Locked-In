import { Disclosure } from "@headlessui/react"
import { ChevronUpIcon } from "@heroicons/react/20/solid"

export default function HowToPlay() {
  return (
    <div className="min-h-screen px-4 py-10 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center">How to Play</h1>

        {/* Sections */}
        <Section title="Objective">
          Your goal is to choose one NFL team each week that you believe will win their game. You need to be careful though, you can only 
          choose each team once during the regular season! Join a group with 4 to 10 of your friends, and put your prediction knowledge on
          display!
        </Section>

        <Section title="Rules">
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-200">
            <li>Select one NFL Team per week to win their matchup that week.</li>
            <li>If that team wins, you receive points. If they lose you receive no points.</li>
            <li>Regardless if your selected team wins or loses, you now cannot use that team again, so choose wisely.</li>
            <li>The amount of points you receive in the event of a win can depend. Check the scoring table below.</li>
            <li>Get your pick in in time! Some games require a selection before others, check here to see more.</li>
          </ul>
        </Section>

        <Section title="Scoring">
          <p className="mb-4">
             Scoring is based on the number of members in your group, and the amount of those members who have selected the same team as you.
             The table below shows the amount of points you will receive based on the number of players who picked the same team in the event
             that the chosen team wins. If the team loses, all players receive 0 points regardless of how many players picked that team.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-300 border border-gray-600 rounded-lg">
              <thead className="bg-white/10 text-gray-200">
                <tr>
                  <th className="px-4 py-2 border-b border-gray-600" colSpan={4}>
                    Points Earned Based on Group Size and Shared Picks
                  </th>
                </tr>
                <tr>
                  <th className="px-4 py-2 border-b border-gray-600">Group Size</th>
                  <th className="px-4 py-2 border-b border-gray-600">4-5 Players</th>
                  <th className="px-4 py-2 border-b border-gray-600">6-7 Players</th>
                  <th className="px-4 py-2 border-b border-gray-600">8-10 Players</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="px-4 py-2 font-medium">Only you picked this team</td>
                  <td className="px-4 py-2">10</td>
                  <td className="px-4 py-2">10</td>
                  <td className="px-4 py-2">10</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">2 players picked this team</td>
                  <td className="px-4 py-2">7</td>
                  <td className="px-4 py-2">8</td>
                  <td className="px-4 py-2">9</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">3 players picked this team</td>
                  <td className="px-4 py-2">5</td>
                  <td className="px-4 py-2">6</td>
                  <td className="px-4 py-2">7</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">4 players picked this team</td>
                  <td className="px-4 py-2">3</td>
                  <td className="px-4 py-2">5</td>
                  <td className="px-4 py-2">6</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">5+ players picked this team</td>
                  <td className="px-4 py-2">2</td>
                  <td className="px-4 py-2">4</td>
                  <td className="px-4 py-2">5</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Pick Deadlines">
            <div className="space-y-4 text-sm text-gray-200">
                <p>
                Due to the nature of the NFL schedule, some games require picks to be made before others. 
                For Pick 'Em, we have divided each NFL week into Wave 1 and Wave 2.
                </p>
                
                <p>
                <strong>Wave 1 games</strong> are any games that are scheduled for Thursday, Friday, or Saturday of that week. 
                For the most part, Wave 1 games will mostly be Thursday Night Football, but Friday and Saturday games may appear 
                towards the tail end of the season.
                </p>
                
                <p>
                <strong>Wave 2 games</strong> are any games that are scheduled for Sunday or Monday of that week.
                </p>
                
                <p className="font-bold text-white">
                Regardless of when your game takes place in its respective Wave, you must have your pick in by the Wave's deadline!
                </p>
                
                <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-300 border border-gray-600 rounded-lg">
                    <thead className="bg-white/10 text-gray-200">
                    <tr>
                        <th className="px-4 py-2 border-b border-gray-600">Wave</th>
                        <th className="px-4 py-2 border-b border-gray-600">Days</th>
                        <th className="px-4 py-2 border-b border-gray-600">Deadline</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                    <tr>
                        <td className="px-4 py-2 font-medium">Wave 1</td>
                        <td className="px-4 py-2">Thursday, Friday, Saturday</td>
                        <td className="px-4 py-2">7:45 PM ET on Thursday</td>
                    </tr>
                    <tr className="bg-white/5">
                        <td className="px-4 py-2 font-medium">Wave 2</td>
                        <td className="px-4 py-2">Sunday, Monday</td>
                        <td className="px-4 py-2">12:30 PM ET on Sunday</td>
                    </tr>
                    </tbody>
                </table>
                </div>
                
                <p className="text-xs text-gray-400 italic">
                Note: These deadlines are subject to change in the event of rescheduled games, 
                or alternate time games such as Thanksgiving and Christmas games.
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
    answer: "Yes, for now Pick 'Em is only avaialable from weeks 1 to 18 of the NFL regular season. We may expand to playoffs in the future.",
  },
  {
    question: "What happens if I don't get my pick in on time?",
    answer: `If you have the "Auto Pick" setting enabled, a random team will be selected for you if you do not make your pick before the deadline.
             Otherwise, you will receive 0 points for that week and will not be able to make a pick. Neither of these options are very good so don't
             forget to make your pick!`,
  }
]