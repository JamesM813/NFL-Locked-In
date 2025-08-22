export default function PrivacyPolicy() {


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8 text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: August 22nd, 2025</p>
        </header>

        <section className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md space-y-4">
          <h2 className="text-xl font-semibold">What We Collect</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li><strong>Basic profile information:</strong> Username and profile picture</li>
            <li><strong>Game predictions:</strong> Your NFL game picks and scores within groups</li>
            <li><strong>Group participation:</strong> Groups you join or create</li>
            <li><strong>Contact form submissions:</strong> Name, email, and message if you contact us</li>
          </ul>
        </section>

        <section className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md space-y-4">
          <h2 className="text-xl font-semibold">How We Use Your Information</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Enable you to make NFL picks and compete with friends</li>
            <li>Display leaderboards and group standings</li>
            <li>Allow you to join and manage groups</li>
            <li>Respond to contact form inquiries</li>
          </ul>
        </section>

        <section className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md space-y-4">
          <h2 className="text-xl font-semibold">Data Sharing</h2>
          <p className="text-gray-300">
            <strong>We do not share, sell, or distribute your personal information to any third parties.</strong> 
            Your data stays within our application and is only visible to:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>You (your own data)</li>
            <li>Other members of groups you join (your picks and scores within those groups)</li>
          </ul>
        </section>

        <section className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md space-y-4">
          <h2 className="text-xl font-semibold">Data Storage</h2>
          <p className="text-gray-300">
            Your information is securely stored in our database and retained as long as your account is active. You can request account deletion by contacting us.
          </p>
        </section>

        <section className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md space-y-4">
          <h2 className="text-xl font-semibold">Third-Party Services</h2>
          <p className="text-gray-300">
            This application uses Supabase and Google OAuth for authentication and data storage. Please review both services's Privacy Policy for information on how they handle your data.
          </p>
        </section>

        <section className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md space-y-4">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-gray-300">
            If you have questions about this privacy policy or want to delete your account, contact us at <a href="mailto:jrm803@gmail.com" className="underline text-blue-400">jrm803@gmail.com</a>.
          </p>
        </section>

        <section className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md space-y-4">
          <h2 className="text-xl font-semibold">Changes</h2>
          <p className="text-gray-300">
            We may update this privacy policy occasionally. Any changes will be posted on this page.
          </p>
        </section>

        <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-6 shadow-md border border-yellow-500/30">
          <h2 className="text-xl font-semibold text-yellow-300 mb-2">Disclaimer</h2>
          <p className="text-sm text-yellow-200">
            This is a personal project developed for entertainment purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
