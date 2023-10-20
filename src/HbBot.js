

const serverHost = "https://hb-chatbot-delta.vercel.app"

function HbBot() {
  /////////////////////////////////////////////////////////////////////
  const userName = config.userConfig.userName
    ? config.userConfig.userName
    : "Guest";
  const profilePic = config.userConfig.profilePic
    ? config.userConfig.profilePic
    : "/src/assets/images/user.png";
  const botName = config.botConfig.botName ? config.botConfig.botName : "Bot";
  const botProfilePic = config.botConfig.botProfilePic
    ? config.botConfig.botProfilePic
    : "/src/assets/images/user.png";
  const dateFormat = config.generalConfig.dateFormat
    ? config.generalConfig.dateFormat
    : "hh:mm A| MMM DD";
  const chatView = config.generalConfig.chatWindow
    ? config.generalConfig.chatWindow
    : "FullScreen";
  const defaultOpen = config.generalConfig.openChatByDefault
    ? config.generalConfig.openChatByDefault
    : false;
  const configsampleQues = config.sampleQuestions ? config.sampleQuestions : [];
  const dateLocale = config.generalConfig.dateLocale
    ? config.generalConfig.dateLocale
    : "en";
  if (config.serverEndpoint == "") {
    return console.error("Required server endpoint");
  }
  const additionalConfig = config.additionalConfig ? config.additionalConfig : {}  

  const serverHost = "https://hb-chatbot-delta.vercel.app"

  const { useEffect, useState, useRef } = React;
  const [isopenChat, setIsOpenChat] = useState(defaultOpen);
  const ENV_API_URL = config.serverEndpoint;
  const [loading, setLoading] = useState(false);
  const [speechValue, setSpeechValue] = useState("");
  const bottomRef = useRef(null);
  const [conversation, setConversation] = useState([]);
  const [sampleQuestion, setSampleQuestion] = useState(configsampleQues);
  const [islistening, setIslistening] = useState(false);
  const [chatWindow, setChatWindow] = useState(chatView);

  // let chatWindow = "";
  // const queryString = window.location.search;
  // const urlParams = new URLSearchParams(queryString);
  // const product = urlParams.get("view");
  // console.log(product);
  // if (product == "ChatScreen") {
  //   chatWindow = "ChatScreen";
  // } else if (product == "FullScreen") {
  //   chatWindow = "FullScreen";
  // }

    moment.locale(dateLocale);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
    if (conversation.length > 0) {
      const Last20 = conversation.slice(-40);
      if (userName == "Guest") {
        sessionStorage.setItem(`${userName}`, JSON.stringify(Last20));
      } else {
        localStorage.setItem(`${userName}`, JSON.stringify(Last20));
      }
    }
  }, [conversation, isopenChat]);

  useEffect(() => {
    if (
      userName == "Guest" &&
      sessionStorage.getItem(`${userName}`)?.length > 0
    ) {
      let RestoreFromSessionStorage = JSON.parse(
        sessionStorage.getItem(`${userName}`)
      );
      setConversation(RestoreFromSessionStorage);
    } else if (
      userName != "Guest" &&
      localStorage.getItem(`${userName}`)?.length > 0
    ) {
      let RestoreFromLocalStorage = JSON.parse(
        localStorage.getItem(`${userName}`)
      );
      setConversation(RestoreFromLocalStorage);
    }

   
  }, []);

  const speech = (sys) => {
    console.log(window);
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      let speechRecognition = new (window.webkitSpeechRecognition ||
        window.SpeechRecognition)();
      let final_transcript = "";
      speechRecognition.continuous = false;
      speechRecognition.interimResults = true;
      (speechRecognition.lang = "en-US"),
        (speechRecognition.onstart = () => {
          // Show the Status Element
          setIslistening(true);
          console.log("start");
        });

      speechRecognition.onspeechend = function () {
        // when user is done speaking
        speechRecognition.stop();
        setIslistening(false);
      };

      speechRecognition.onend = () => {
        speechRecognition.stop();
        setIslistening(false);
        console.log("Speech recognition service disconnected");
      };

      speechRecognition.onresult = (event) => {
        // Create the interim transcript string locally because we don't want it to persist like final transcript
        let interim_transcript = "";

        // Loop through the results from the speech recognition object.
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          // If the result item is Final, add it to Final Transcript, Else add it to Interim transcript
          if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript;
          } else {
            interim_transcript += event.results[i][0].transcript;
          }
        }
        console.log(final_transcript);
        setSpeechValue(final_transcript);
      };

      speechRecognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
      };

      if (sys == "start") {
        speechRecognition.start();
      }
      if (sys == "end") {
        speechRecognition.stop();
        setIslistening(false);
      }
    } else {
      console.error("Speech recognition is not supported in this browser.");
    }
  };

  const handleTextArea = (e) => {
    const value = e.target.value;
    setSpeechValue(value);
    console.log();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e, sampleQues) => {
    e.preventDefault();
    if (speechValue.trim() === "" && sampleQues?.length == undefined) {
      return;
    }
    const formattedDateTime = moment().format();

    setSpeechValue("");
    setLoading(true);
    let messageWithLineBreaks = "";

    if (sampleQues !== undefined && sampleQuestion.includes(sampleQues)) {
      messageWithLineBreaks = sampleQues.replace(/\n/g, "<br>");
    } else {
      messageWithLineBreaks = speechValue.replace(/\n/g, "<br>");
    }

    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Replace URLs with anchor tags
    const processedValue = messageWithLineBreaks.replace(urlRegex, (match) => {
      return `<a href="${match}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });

    const textOnly = processedValue.replace(/<br>/g, "").trim();
    const ProcessQues = {
      sender: "User",
      content: textOnly,
      time: formattedDateTime,
    };
    setConversation((con) => [...con, ProcessQues]);

    let apiPayload = {
      question: textOnly,
      debug: "False",
    }
  
    if(Object.keys(additionalConfig).length > 0) {
        apiPayload['additionalConfig'] = additionalConfig
    }

    try {
      const response = await axios.post(
        ENV_API_URL,
        apiPayload,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Access-Control-Allow-Origin": "*"
          },
        }
      );

      if (response.status === 200) {
        
        let responseText = ""
        let responseTable = []
        if(response.data.response.includes("Answer")){
          responseText = response.data.response.replace("Answer:", "")
        } else if(response.data.response) {
          responseText = response.data.response
        }

        if(Array.isArray(response.data.query_result)) {
          responseTable = [...response.data.query_result]
        }

        const Response = {
          sender: "System",
          content: {
            Response_Table: responseTable,
            Response_Answer: responseText,
          },
          time: formattedDateTime,
        };
        setConversation((con) => [...con, Response]);
        setLoading(false);
      } else {
        //console.log("error occured")
      }
    } catch (error) {
      console.log("eerorr", error)
      const Errormsg = {
        sender: "System",
        content: {
          Response_Answer: "Not able to find solution. Try again.",
        },
        time: formattedDateTime,
      };

      setConversation((con) => [...con, Errormsg]);
      setLoading(false);
    }
  };

  function ShowTable(props) {
    const { table } = props;

    String.prototype.toProperCase = function () {
      return this.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    };
    function convertCamelCaseToWords(camelCaseString) {
      // Insert a space before all uppercase letters, then capitalize the first letter
      return camelCaseString.replace(/([A-Z])/g, ' $1')
                          .replace(/^./, function(str){ return str.toUpperCase(); });
    }
    const RowKeys = Object.keys(table[0]).map((key) =>
    {
      // key.replaceAll("_", " ").toProperCase()
      const keyReplace = key.replaceAll("_", " ")
      const value = convertCamelCaseToWords(keyReplace)
      return value
    } 

    );
    const rows = Object.keys(table[0]);

    return (
      <>
        <table className="hbchat-custom-table">
          <tr>
            <th>Sr No</th>
            {RowKeys.map((key, index) => (
              <th key={index}>{key}</th>
            ))}
          </tr>
          {table.map((row, index) => {
            return (
              <tr key={index}>
                <td>{index + 1}</td>
                {rows.map((key, index) => (
                  <td>{row[key]}</td>
                ))}
              </tr>
            );
          })}
        </table>
      </>
    );
  }

  const DisplayAnswer = (props) => {
    const { text } = props;

    return (
      <>
        <p dangerouslySetInnerHTML={{ __html: `${text?.Response_Answer}` }} />
        {text?.Response_Table?.length > 1 ? (
          <>
            <ShowTable table={text.Response_Table} />
          </>
        ) : (
          ``
        )}
      </>
    );
  };

  const DateStickyBar = ({ index }) => {
    let date = "";
    if (
      index == 0 ||
      moment(conversation[index].time).format("YYYY-MM-DD") !=
      moment(conversation[index - 1].time).format("YYYY-MM-DD")
    ) {
      if (
        moment(conversation[index].time).format("YYYY-MM-DD") ==
        moment().format("YYYY-MM-DD")
      ) {
        date = "Today";
      } else if (
        moment(conversation[index].time).format("YYYY-MM-DD") ==
        moment().subtract(1, "Days").format("YYYY-MM-DD")
      ) {
        date = "Yesterday";
      }
      return (
        <div className="hbchat-date-sticky-bar">
          <div className="hbchat-dsb-in">
            <p>{date}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <section id="hb-chat-box">
        {isopenChat ? (
          <div
            className={`${chatWindow == "ChatScreen" ? "ChatScreen" : "FullScreen"
              }`}
          >
            <div className="hbchat-container">
              <div className="hbchat-row">
                <div className="hbchat-main-chat-box">
                  <div className="hbchat-chat-box-top">
                    <div className="hbchat-top-sec">
                    <div className="hbchat-profile-pic">
                    <i>
                          {" "}
                          <img src={config.appConfig.appLogo} alt="" width="50px" />
                        </i>
                    </div>
                      <div className="hbchat-lt-side">
                        
                        <h2 className="hbchat-h2">{config.appConfig.appName}</h2>
                      </div>
                      <div className="hbchat-rt-side">
                        <button
                          className="hbchat-close-icon"
                          onClick={() => {
                            setIsOpenChat((isopenChat) => !isopenChat);
                          }}
                        >
                          <img src={serverHost + "/src/assets/images/close-icon.png"} alt="" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="hbchat-chat-sec">
                    {conversation.length > 0 &&
                      conversation.map((convo, index) => {
                        if (convo.sender === "User") {
                          return (
                            <>
                              <DateStickyBar index={index} />
                              <div className="hbchat-chat-card hbchat-outgoing">
                                <div className="hbchat-profile">
                                  <img
                                    src={profilePic}
                                    alt=""
                                    width="30"
                                    className="hbchat-display-profile"
                                  />
                                  <h2 className="hbchat-h2">{userName}</h2>
                                  <span className="hbchat-date-time">
                                    <time>
                                      {moment(convo.time).format(dateFormat)}
                                    </time>
                                  </span>
                                </div>

                                <div className="hbchat-txt">
                                  <p
                                    dangerouslySetInnerHTML={{
                                      __html: `${convo.content}`,
                                    }}
                                  ></p>
                                </div>
                              </div>
                            </>
                          );
                        } else if (convo.sender === "System") {
                          return (
                            <>
                              <DateStickyBar index={index} />
                              <div className="hbchat-chat-card hbchat-incoming">
                                <div className="hbchat-profile">
                                  <img
                                    src={botProfilePic}
                                    alt=""
                                    width="30"
                                    className="hbchat-display-profile"
                                  />
                                  <h2 className="hbchat-h2">{botName}</h2>
                                  <span className="hbchat-date-time">
                                    <time>
                                      {moment(convo.time).format(dateFormat)}
                                    </time>
                                  </span>
                                </div>
                                <div className="hbchat-txt">
                                  <DisplayAnswer text={convo.content} />
                                </div>
                              </div>
                            </>
                          );
                        }
                      })}

                    {loading ? (
                      <div className="hbchat-chat-card hbchat-loading-card">
                        <div className="hbchat-profile">
                          <img
                            src={botProfilePic}
                            alt=""
                            width="30"
                            className="hbchat-display-profile"
                          />
                          <h2 className="hbchat-h2">{botName}</h2>
                        </div>
                        <div className="hbchat-txt">
                          <div className="hbchat-typing-loader"></div>
                        </div>
                      </div>
                    ) : null}

                    <div ref={bottomRef}></div>

                    <div className="hbchat-chip-card">
                      <ul>
                        {conversation.length <= 1 &&
                          sampleQuestion.length > 0 &&
                          sampleQuestion.map((question, index) => {
                            return (
                              <li
                                key={index}
                                onClick={(e) => {
                                  handleSubmit(e, question);
                                }}
                              >
                                <div className="hbchat-cmn-que">
                                  <p>{question}</p>
                                </div>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  </div>

                  <div className="hbchat-chat-footer">
                    <div className="hbchat-msg-send">
                      <input
                        type="text"
                        name="input_text"
                        placeholder="Type your message here..."
                        value={speechValue}
                        onChange={handleTextArea}
                        onKeyDown={handleKeyDown}
                      />

                      <div className="hbchat-buttons">
                        <button
                          onClick={handleSubmit}
                          disabled={speechValue.length <= 0 || loading}
                        >
                          {speechValue.length > 0 ? (
                            <img
                              className="hbchat-blue-btn"
                              src={serverHost + "/src/assets/images/send-btn.png"}
                              alt=""
                            />
                          ) : (
                            <img
                              className="hbchat-grey-btn"
                              src={serverHost + "/src/assets/images/send-btn-h.png"}
                              alt=""
                            />
                          )}
                        </button>
                        {islistening ? (
                          <button
                            className="hbchat-h-mic"
                            onClick={() => {
                              speech("end");
                            }}
                          >
                            <i></i>{" "}
                            <img
                              className="hbchat-grey-btn-mick"
                              src={serverHost + "/src/assets/images/mic.png"}
                              alt=""
                            />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              speech("start");
                            }}
                          >
                            <img
                              className="hbchat-blue-btn-mick"
                              src={serverHost + "/src/assets/images/mic-h.png"}
                              alt=""
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div
          className="hbchat-floating-btn"
          onClick={() => {
            setIsOpenChat((isopenChat) => !isopenChat);
          }}
        >
          <i>
            {isopenChat ? (
              <img
                src={serverHost + "/src/assets/images/close-btn.png"}
                alt=""
                className="hbchat-chat-open-btn"
              />
            ) : (
              <img
                src={serverHost + "/src/assets/images/chat-btn.png"}
                width="30"
                alt=""
                className="hbchat-close-btn"
              />
            )}
          </i>
        </div>
      </section>
    </>
  );
}

const loadEle = (typeoffile = "script", FILE_URL, async = true, type = "") => {

  return new Promise((resolve, reject) => {
    try {
      const element = typeoffile === "script" ? document.createElement("script") : document.createElement("link");
      element.type = typeoffile === "script" ? type : "text/css";
      element.async = async;
      typeoffile === "script" ? element.src = FILE_URL : element.href = FILE_URL
      if (typeoffile === "css") {
        element.rel = "stylesheet";
      }

      element.addEventListener("load", (ev) => {
        resolve({ status: true });
      });

      element.addEventListener("error", (ev) => {
        reject({
          status: false,
          message: `Failed to load the ${typeoffile} ${FILE_URL}`,
        });
      });

      document.head.appendChild(element);
    } catch (error) {
      reject(error);
    }
  });
};

// Production
// https://unpkg.com/react@18/umd/react.production.min.js
// https://unpkg.com/react-dom@18/umd/react-dom.production.min.js

//Development
// https://unpkg.com/react@18/umd/react.development.js
// https://unpkg.com/react-dom@18/umd/react-dom.development.js

console.log("loading started...");

loadEle("script", "https://unpkg.com/react@18/umd/react.production.min.js", true)
  .then(data => {
    console.log("React loaded successfully");
    if ("React" in window) {
      loadEle("script", "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js", true)
        .then(data => {
          console.log("ReactDom loaded successfully");
          if ("ReactDOM" in window && "React" in window) {
            const containerId = config.appConfig.containerId
              ? config.appConfig.containerId
              : "chatBot-Box";

            const Div = document.createElement("div");
            Div.id = containerId
            Div.className = "hb-common-chatbot"
            document.body.appendChild(Div);
            const container = document.getElementById(containerId);
            const root = ReactDOM.createRoot(container);
            root.render(<HbBot />);
          }
        })
        .catch(err => {
          console.error(err);
        });
    } else {
      console.log("react not found...");
    }
  })
  .catch(err => {
    console.error(err);
    console.log("loading error...", err);
  });

loadEle("script", "https://unpkg.com/axios/dist/axios.min.js", true)
  .then(data => {
    console.log("Axios loaded successfully");
  })
  .catch(err => {
    console.error(err);
  });
loadEle("script", "https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js", true)
  .then(data => {
    console.log("Moment loaded successfully");
  })
  .catch(err => {
    console.error(err);
  });


loadEle("css", serverHost + "/src/assets/css/chat-box.css")
  .then(data => {
    console.log("Css loaded successfully");
  })
  .catch(err => {
    console.error(err);
  });


// loadEle("script", "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",true)
//   .then(data => {
//     console.log("ReactDom loaded successfully");
//     if ("ReactDOM" in window && "React" in window) {
//       const containerId = config.appConfig.containerId
//         ? config.appConfig.containerId
//         : "chatBot-Box";

//       const Div = document.createElement("div");
//       Div.id = containerId
//       Div.className = "chat-Box-cls"
//       document.body.appendChild(Div);
//       const container = document.getElementById(containerId);
//       const root = ReactDOM.createRoot(container);
//       root.render(<HbBot />);
//     }
//   })
//   .catch(err => {
//     console.error(err);
//   });


const headerbg = `--chatHeadingBg`
const sampleQuestionBg = `--floatingBottomButtons`
const chatScreenBg = `--chatScreenBg`
const dateBadgeBg = `--chatDayLabelBg`
const outgoingChatCellBg = `--chatOutgoindMsgBg`
const incomingChatCellBg = `--chatIngoindMsgBg`
const micAnimateBg = `--chatMicAnimBg`

const headingTitleClr = `--chatHeadingTitle`
const dateBadgeClr = `--chatDayLabelText`
const chatDateTimeClr = `--chatDateTimeLbl`
const chatNameClr = `--chatNameClr`
const incomingChatCellTextClr = `--chatIngoindMsgTextClr`
const outgoingChatCellTextClr = `--chatOutgoindMsgTextClr`

const headingTitleFont = `--chatHeadingTitleSize`
const outgoingChatFont = `--chatOutgoindMsgTextSize`
const incomingChatFont = `--chatIngoindMsgTextSize`

const tableBroder = `--chatTableBrdrClr`
const tableHeaderBg = `--chatTableCellHdrBg`
const tableheaderClr = `--chatTableCellHdrClr`
const tableCellClr = `--chatTableCellClr`
const tableEvenCellBg = `--chatTableEvenBg`

const {backgroundColor,textColor,fontSize,table} = config.themeConfig

document.body.style.setProperty(headerbg ,backgroundColor.headerbg);
document.body.style.setProperty(sampleQuestionBg ,backgroundColor.sampleQuestionBg);
document.body.style.setProperty(chatScreenBg ,backgroundColor.chatScreenBg);
document.body.style.setProperty(dateBadgeBg ,backgroundColor.dateBadgeBg);
document.body.style.setProperty(outgoingChatCellBg ,backgroundColor.outgoingChatCellBg);
document.body.style.setProperty(incomingChatCellBg ,backgroundColor.incomingChatCellBg);
document.body.style.setProperty(micAnimateBg ,backgroundColor.micAnimateBg);

document.body.style.setProperty(headingTitleClr ,textColor.headingTitleClr)
document.body.style.setProperty(dateBadgeClr ,textColor.dateBadgeClr )
document.body.style.setProperty(chatDateTimeClr ,textColor.chatDateTimeClr )
document.body.style.setProperty(chatNameClr ,textColor.chatNameClr )
document.body.style.setProperty( incomingChatCellTextClr ,textColor. incomingChatCellTextClr )
document.body.style.setProperty(outgoingChatCellTextClr ,textColor.outgoingChatCellTextClr )


document.body.style.setProperty(headingTitleFont , fontSize.headingTitleFont );
document.body.style.setProperty(outgoingChatFont ,fontSize.outgoingChatFont );
document.body.style.setProperty(incomingChatFont ,fontSize.incomingChatFont );

document.body.style.setProperty(tableBroder , table.tableBroder )
document.body.style.setProperty(tableHeaderBg , table.tableHeaderBg )
document.body.style.setProperty(tableheaderClr , table.tableheaderClr )
document.body.style.setProperty(tableCellClr , table.tableCellClr )
document.body.style.setProperty(tableEvenCellBg , table.tableEvenCellBg )
