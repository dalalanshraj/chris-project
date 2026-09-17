export default function PreferencesTab() {
  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-semibold">
        Preferences
      </h2>

      <div className="grid grid-cols-2 gap-6">

        <div>
          <label className="block text-sm mb-2">
            Timezone
          </label>

          <select className="w-full border rounded-lg p-3">

            <option>America/Chicago</option>

            <option>America/New_York</option>

            <option>America/Denver</option>

            <option>America/Los_Angeles</option>

            <option>America/Phoenix</option>

          </select>

        </div>

        <div>
          <label className="block text-sm mb-2">
            Language
          </label>

          <select className="w-full border rounded-lg p-3">

            <option>English</option>

          </select>

        </div>

      </div>

      <button className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl">
        Save Preferences
      </button>

    </div>
  );
}