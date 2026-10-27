import {
  HomeIcon,
  UserIcon,
  UserGroupIcon,
  CalendarIcon,
  TaskIcon,
  InvoiceIcon,
  LetterIcon,
  ChatIcon,
} from "./icon";

const CREATOR_NAV = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: <HomeIcon />,
        items: [],
      },
      {
        title: "Campaigns",
        url: "/dashboard/campaigns",
        icon: <CalendarIcon />,
        items: [],
      },
      {
        title: "My Applications",
        url: "/dashboard/applications",
        icon: <TaskIcon />,
        items: [],
      },
      {
        title: "Submissions",
        url: "/dashboard/submissions",
        icon: <LetterIcon />,
        items: [],
      },
    ],
  },

  {
    label: "FINANCE",
    items: [
      {
        title: "Wallet",
        url: "/dashboard/wallet",
        icon: <InvoiceIcon />,
        items: [],
      },
      {
        title: "Withdrawals",
        url: "/dashboard/withdrawals",
        icon: <InvoiceIcon />,
        items: [],
      },
    ],
  },

  {
    label: "SUPPORT",
    items: [
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: <ChatIcon />,
        items: [],
      },
      {
        title: "Disputes",
        url: "/dashboard/disputes",
        icon: <LetterIcon />,
        items: [],
      },
    ],
  },

  {
    label: "ACCOUNT",
    items: [
      {
        title: "Profile",
        url: "/dashboard/profile",
        icon: <UserIcon />,
        items: [],
      },
    ],
  },
];

const BRAND_NAV = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: <HomeIcon />,
        items: [],
      },
      {
        title: "My Campaigns",
        url: "/dashboard/campaigns",
        icon: <CalendarIcon />,
        items: [],
      },
      {
        title: "Applications",
        url: "/dashboard/applications",
        icon: <TaskIcon />,
        items: [],
      },
      {
        title: "Submissions",
        url: "/dashboard/submissions",
        icon: <LetterIcon />,
        items: [],
      },
    ],
  },

  {
    label: "SUPPORT",
    items: [
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: <ChatIcon />,
        items: [],
      },
      {
        title: "Disputes",
        url: "/dashboard/disputes",
        icon: <LetterIcon />,
        items: [],
      },
    ],
  },

  {
    label: "ACCOUNT",
    items: [
      {
        title: "Profile",
        url: "/dashboard/profile",
        icon: <UserIcon />,
        items: [],
      },
    ],
  },
];

const ADMIN_NAV = [
  {
    label: "ADMIN",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: <HomeIcon />,
        items: [],
      },
      {
        title: "Users",
        url: "/dashboard/users",
        icon: <UserGroupIcon />,
        items: [],
      },
      {
        title: "Campaigns",
        url: "/dashboard/campaigns",
        icon: <CalendarIcon />,
        items: [],
      },
      {
        title: "Withdrawals",
        url: "/dashboard/withdrawals",
        icon: <InvoiceIcon />,
        items: [],
      },
    ],
  },

  {
    label: "MODERATION",
    items: [
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: <ChatIcon />,
        items: [],
      },
      {
        title: "Disputes",
        url: "/dashboard/disputes",
        icon: <LetterIcon />,
        items: [],
      },
    ],
  },
];

export const getNavData = (role) => {
  switch (role) {
    case "CREATOR":
      return CREATOR_NAV;

    case "BRAND":
      return BRAND_NAV;

    case "ADMIN":
      return ADMIN_NAV;

    default:
      return [];
  }
};
