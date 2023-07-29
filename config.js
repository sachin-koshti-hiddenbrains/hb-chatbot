const config = {
  serverEndpoint: 'http://192.168.36.243:8888/query',
  appConfig: {
    appName: 'Hidden Brains',
    appLogo: '/src/assets/images/hblogo.jpeg',
    containerId: '',
  },
  userConfig: {
    userName: '',
    profilePic: '',
  },
  botConfig: {
    botName: '',
    botProfilePic: '',
  },

  generalConfig: {
    dateLocale: 'en',
    dateFormat: '',
    chatWindow: 'FullScreen',
    openChatByDefault: true,
  },

  themeConfig: {
    backgroundColor: {
      headerbg: '',
      sampleQuestionBg: '',
      chatScreenBg: '',
      dateBadgeBg: '',
      outgoingChatCellBg: '',
      incomingChatCellBg: '',
      micAnimateBg: '',
    },

    textColor: {
      headingTitleClr: '',
      dateBadgeClr: '',
      chatDateTimeClr: '',
      chatNameClr: '',
      incomingChatCellTextClr: '',
      outgoingChatCellTextClr: '',
    },
    fontSize: {
      headingTitleFont: '',
      outgoingChatFont: '',
      incomingChatFont: '',
    },
    table: {
      tableBroder: '',
      tableHeaderBg: '',
      tableEvenCellBg: '',
      tableheaderClr: '',
      tableCellClr: '',
    },
  },
  sampleQuestions: [
    'Top dealers of lagos based on amount',
    'Total Revenue of current year',
    'what is final revenue of this month',
  ],
};
