const config = {
  serverEndpoint: 'https://vts-gpt.mrsholdings.com/query',
  appConfig: {
    appName: 'Hidden Brains',
    appLogo: '/src/assets/images/hblogo.jpeg',
    containerId: '',
  },
  additionalConfig: {
    company_access_key: "05e620e7abd9e2a9c54e81561841e94d"
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
