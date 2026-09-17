import { FaCamera } from "react-icons/fa";

export default function ProfileHeader({
  user,
  activeTab,
  setActiveTab,
}) {
  const tabs = [
    "Profile",
    "Address",
    "Social",
    "Preferences",
    "Security",
  ];

  return (
    <div className="bg-white rounded-2xl shadow">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-8 border-b">

        <div className="flex items-center gap-6">

          {/* PHOTO */}
          <div className="relative">

            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-200">

              {user.photo ? (
                <img
                  src={user.photo}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold">
                  {user.name?.charAt(0)}
                </div>
              )}

            </div>

            <button
              className="
              absolute
              bottom-1
              right-1
              w-9
              h-9
              rounded-full
              bg-blue-600
              text-white
              flex
              items-center
              justify-center
              shadow-lg
              hover:bg-blue-700
              transition
              "
            >
              <FaCamera />
            </button>

          </div>

          {/* INFO */}
          <div>

            <h1 className="text-3xl font-semibold text-gray-800">
              {user.name}
            </h1>

            <p className="text-gray-500 mt-1">
              {user.email}
            </p>

            <span className="inline-block mt-3 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
              {user.role}
            </span>

          </div>

        </div>

      </div>

      {/* TABS */}

      <div className="flex overflow-x-auto">

        {tabs.map((tab) => (

          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
                px-6
                py-4
                text-sm
                font-medium
                whitespace-nowrap
                border-b-2
                transition

                ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-blue-600"
                }
            `}
          >
            {tab}
          </button>

        ))}

      </div>

    </div>
  );
}