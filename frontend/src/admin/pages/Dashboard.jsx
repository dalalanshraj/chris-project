import { useEffect, useState } from "react";
import api from "../../api/axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  FaBuilding,
  FaEnvelope,
  FaStar,
  FaClock,
  FaArrowRight,
  FaChartLine,
  FaChartPie,
} from "react-icons/fa";


// ============================================================
// COLORS
// ============================================================

const COLORS = [
  "#6366f1",
  "#06b6d4",
];


// ============================================================
// DASHBOARD
// ============================================================

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ==========================================================
  // FETCH DASHBOARD
  // ==========================================================

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get(
          "/bookings/admin/dashboard"
        );

        console.log(
          "DASHBOARD RESPONSE 👉",
          res.data
        );

        setStats(res.data);
      } catch (err) {
        console.error(
          "DASHBOARD ERROR 👉",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load dashboard."
        );
      }
    };

    fetchDashboard();
  }, []);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (!stats && !error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">

          <div
            className="
              w-12
              h-12
              border-4
              border-blue-100
              border-t-blue-600
              rounded-full
              animate-spin
            "
          />

          <p className="text-sm text-slate-500">
            Loading dashboard...
          </p>

        </div>
      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">

        <div className="bg-white border border-red-100 rounded-3xl p-8 text-center shadow-sm max-w-md">

          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <FaClock size={22} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-800">
            Dashboard unavailable
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="
              mt-6
              px-5
              py-3
              rounded-xl
              bg-blue-600
              hover:bg-blue-700
              text-white
              text-sm
              font-semibold
              transition
            "
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  // ==========================================================
  // PIE DATA
  // ==========================================================

  const pieData = [
    {
      name: "Properties",
      value: Number(
        stats.totalListing || 0
      ),
    },
    {
      name: "Inquiry",
      value: Number(
        stats.totalInquiry || 0
      ),
    },
  ];


  // ==========================================================
  // LINE DATA
  // ==========================================================

  const lineData =
    stats.monthlyBookings || [];


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto space-y-6">

        {/* ==================================================
            HEADER
        =================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

          <div>

            <div className="flex items-center gap-3">

              <div
                className="
                  w-12
                  h-12
                  rounded-2xl
                  bg-[#047edf]
                  text-white
                  flex
                  items-center
                  justify-center
                  shadow-lg
                  shadow-blue-200
                "
              >
                <FaChartLine size={21} />
              </div>

              <div>

                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Dashboard Overview
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Welcome back. Here's what's happening with your business.
                </p>

              </div>

            </div>

          </div>

          {/* STATUS */}

          <div
            className="
              inline-flex
              items-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              bg-white
              border
              border-slate-200
              shadow-sm
              w-fit
            "
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />

            <span className="text-sm font-semibold text-slate-700">
              System Active
            </span>
          </div>

        </div>


        {/* ==================================================
            MAIN STAT CARDS
        =================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-5">

          <StatCard
            title="Properties"
            value={stats.totalListing}
            icon={<FaBuilding />}
            gradient="from-[#ffbf96] to-[#fe7096]"
            description="Total properties"
            onClick={() =>
              navigate("/admin/listings")
            }
          />

          <StatCard
            title="Inquiry"
            value={stats.totalInquiry}
            icon={<FaEnvelope />}
            gradient="from-[#90caf9] to-[#047edf]"
            description="Total inquiries"
            onClick={() =>
              navigate("/admin/listings")
            }
          />

        </div>


        {/* ==================================================
            REVIEW STATS
        =================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <MiniStat
            title="Total Reviews"
            value={stats.totalReviews}
            icon={<FaStar />}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            description="Reviews received"
            onClick={() =>
              navigate("/admin/listings")
            }
          />

          <MiniStat
            title="Pending Reviews"
            value={stats.pendingReviews}
            icon={<FaClock />}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            description="Waiting for approval"
            onClick={() =>
              navigate("/admin/listings")
            }
          />

        </div>


        {/* ==================================================
            CHARTS
        =================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* =================================================
              PIE CHART
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.4,
            }}
            className="
              bg-white
              border
              border-slate-200
              rounded-3xl
              shadow-sm
              overflow-hidden
            "
          >

            <div className="p-6 border-b border-slate-100">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FaChartPie size={17} />
                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    Dashboard Distribution
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Properties and inquiries overview
                  </p>

                </div>

              </div>

            </div>


            <div className="p-6">

              <ResponsiveContainer
                width="100%"
                height={280}
              >
                <PieChart>

                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={75}
                    outerRadius={105}
                    paddingAngle={5}
                    stroke="none"
                  >

                    {pieData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[index]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow:
                        "0 10px 30px rgba(15,23,42,0.10)",
                    }}
                  />

                </PieChart>
              </ResponsiveContainer>


              {/* LEGEND */}

              <div className="flex flex-wrap justify-center gap-6">

                {pieData.map(
                  (item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2"
                    >

                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            COLORS[index],
                        }}
                      />

                      <span className="text-sm text-slate-600">
                        {item.name}
                      </span>

                      <span className="text-sm font-bold text-slate-900">
                        {item.value}
                      </span>

                    </div>
                  )
                )}

              </div>

            </div>

          </motion.div>


          {/* =================================================
              LINE CHART
          ================================================== */}
{/* 
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
            }}
            className="
              bg-white
              border
              border-slate-200
              rounded-3xl
              shadow-sm
              overflow-hidden
            "
          >

            {/* <div className="p-6 border-b border-slate-100">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FaChartLine size={17} />
                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    Monthly Booking Trend
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Booking activity over time
                  </p>

                </div>

              </div>

            </div>  


            <div className="p-6">

              {lineData.length === 0 ? (

                <div className="h-[280px] flex flex-col items-center justify-center text-center">

                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <FaChartLine size={22} />
                  </div>

                  <h4 className="mt-4 font-semibold text-slate-700">
                    No booking data
                  </h4>

                  <p className="text-sm text-slate-400 mt-1">
                    Monthly booking statistics will appear here.
                  </p>

                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height={280}
                >
                  <LineChart
                    data={lineData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />

                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: "#64748b",
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: "#64748b",
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border:
                          "1px solid #e2e8f0",
                        boxShadow:
                          "0 10px 30px rgba(15,23,42,0.10)",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#6366f1",
                      }}
                      activeDot={{
                        r: 7,
                      }}
                      isAnimationActive
                    />

                  </LineChart>
                </ResponsiveContainer>

              )}

            </div>

          </motion.div> */}

        </div>

      </div>
    </div>
  );
};


// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  title,
  value,
  icon,
  gradient,
  description,
  onClick,
}) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -4,
      }}
      transition={{
        duration: 0.25,
      }}
      onClick={onClick}
      className={`
        relative
        overflow-hidden
        bg-gradient-to-br
        ${gradient}
        rounded-3xl
        p-6
        text-white
        shadow-xl
        cursor-pointer
        group
      `}
    >

      {/* DECORATION */}

      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />

      <div className="absolute -right-16 -bottom-20 w-48 h-48 rounded-full bg-white/5" />


      <div className="relative z-10">

        <div className="flex items-start justify-between">

          <div
            className="
              w-12
              h-12
              rounded-2xl
              bg-white/15
              backdrop-blur-sm
              flex
              items-center
              justify-center
              text-xl
            "
          >
            {icon}
          </div>

          <div
            className="
              w-9
              h-9
              rounded-xl
              bg-white/10
              flex
              items-center
              justify-center
              group-hover:bg-white/20
              transition
            "
          >
            <FaArrowRight size={13} />
          </div>

        </div>


        <p className="mt-7 text-sm font-medium text-white/75">
          {title}
        </p>

        <h2 className="text-4xl font-bold mt-1">
          {value ?? 0}
        </h2>

        <p className="text-xs text-white/65 mt-2">
          {description}
        </p>

      </div>

    </motion.div>
  );
};


// ============================================================
// MINI STAT
// ============================================================

const MiniStat = ({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  description,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      onClick={onClick}
      className="
        bg-white
        border
        border-slate-200
        rounded-3xl
        p-6
        shadow-sm
        hover:shadow-lg
        cursor-pointer
        transition
      "
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="text-3xl font-bold text-slate-900 mt-1">
            {value ?? 0}
          </h2>

          <p className="text-xs text-slate-400 mt-2">
            {description}
          </p>

        </div>


        <div
          className={`
            w-12
            h-12
            rounded-2xl
            ${iconBg}
            ${iconColor}
            flex
            items-center
            justify-center
          `}
        >
          {icon}
        </div>

      </div>

    </motion.div>
  );
};


export default Dashboard;