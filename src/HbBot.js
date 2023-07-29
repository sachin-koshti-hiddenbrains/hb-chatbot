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
    try {
      const response = await axios.post(
        ENV_API_URL,
        {
          question: textOnly,
          debug: "True",
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Access-Control-Allow-Origin": "*"
          },
        }
      );

      // const response = {
      //   data: {
      //     generated_query:
      //       "SELECT customer_name, SUM(sales_value) AS total_sales_value \n                    FROM mrs.sales \n                    WHERE state = 'Lagos' \n                    GROUP BY customer_name \n                    ORDER BY total_sales_value DESC;",
      //     query_result: [
      //       {
      //         customer_name: "B.O GAS AND CHEMICAL LIMITED",
      //         total_sales_value: 3431832924,
      //       },
      //       {
      //         customer_name: "MRS OIL NIGERIA PLC - Victoria Island",
      //         total_sales_value: 1758325795.2799997,
      //       },
      //       {
      //         customer_name: "Sabikat Kassim-Momodu",
      //         total_sales_value: 781822132.5999998,
      //       },
      //       {
      //         customer_name: "Air Peace",
      //         total_sales_value: 621794289.12,
      //       },
      //       {
      //         customer_name: "Mr. Oseni Olanrewaju",
      //         total_sales_value: 608650957.75,
      //       },
      //       {
      //         customer_name: "Abdulazeez Ayodeji",
      //         total_sales_value: 598669853.67,
      //       },
      //       {
      //         customer_name: "Barhok Petroleum Ltd",
      //         total_sales_value: 388613692.97,
      //       },
      //       {
      //         customer_name: "Abiodun Danmole",
      //         total_sales_value: 387559223.59999996,
      //       },
      //       {
      //         customer_name: "Okeke Nkechi",
      //         total_sales_value: 341547139.5,
      //       },
      //       {
      //         customer_name: "Adebanjo Kehinde",
      //         total_sales_value: 338602920.35999995,
      //       },
      //       {
      //         customer_name: "Fobex Nigeria Limited",
      //         total_sales_value: 326964178.00000006,
      //       },
      //       {
      //         customer_name: "ACB Attah",
      //         total_sales_value: 320817754.19,
      //       },
      //       {
      //         customer_name: "OKANLAWON YISA AJADI",
      //         total_sales_value: 315076875.75,
      //       },
      //       {
      //         customer_name: "ODEYEMI SUNDAY ADEBISI",
      //         total_sales_value: 278410357.72,
      //       },
      //       {
      //         customer_name: "MON PLC WHARF ROAD",
      //         total_sales_value: 263243095.75000003,
      //       },
      //       {
      //         customer_name: "Petrolina Okeke",
      //         total_sales_value: 253917312.93,
      //       },
      //       {
      //         customer_name: "Mohammed Bashir Maina",
      //         total_sales_value: 234522708.95,
      //       },
      //       {
      //         customer_name: "AWOPEGBA ANTHONIA IYABO",
      //         total_sales_value: 210993562.28999996,
      //       },
      //       {
      //         customer_name: "Mr. Ijeoma Onyebuchi Ijeoma",
      //         total_sales_value: 209679608.05,
      //       },
      //       {
      //         customer_name: "Hannah Nwaoshai Tochukwu",
      //         total_sales_value: 206546099.56999996,
      //       },
      //       {
      //         customer_name: "ANIKILAYA MARKETING INVESTMENT LTD.",
      //         total_sales_value: 206385549.82999998,
      //       },
      //       {
      //         customer_name: "Abba Dantata",
      //         total_sales_value: 200464922.10000002,
      //       },
      //       {
      //         customer_name: "AGBONIFO EJOOR PHILIP",
      //         total_sales_value: 199999203.35,
      //       },
      //       {
      //         customer_name: "Rudama  Nigeria Company Limited",
      //         total_sales_value: 192573974.98000002,
      //       },
      //       {
      //         customer_name: "MRS OIL NIGERIA PLC - Ebute Meta",
      //         total_sales_value: 184133577.89999998,
      //       },
      //       {
      //         customer_name: "Giwa Mohammed",
      //         total_sales_value: 183422153.93999997,
      //       },
      //       {
      //         customer_name: "MRS Holdings",
      //         total_sales_value: 178237266.23000002,
      //       },
      //       {
      //         customer_name: "Lucas and Allen Limited",
      //         total_sales_value: 174236000,
      //       },
      //       {
      //         customer_name: "Mr. OYEDOKUN ABDULATEEF OLAJIDE",
      //         total_sales_value: 171332750.88,
      //       },
      //       {
      //         customer_name: "Lorion Ventures  Ltd",
      //         total_sales_value: 163743294.73000002,
      //       },
      //       {
      //         customer_name: "Polam Nig Ltd",
      //         total_sales_value: 151602000,
      //       },
      //       {
      //         customer_name: "Adesokan Abosede Olusola",
      //         total_sales_value: 151127554.00000003,
      //       },
      //       {
      //         customer_name: "QUITS AVIATION FREE ZONE COMPANY",
      //         total_sales_value: 145818121,
      //       },
      //       {
      //         customer_name: "Angoz Frank Venture Limited",
      //         total_sales_value: 102667476.69999999,
      //       },
      //       {
      //         customer_name: "PAULETTE OBRUCHE LEO-OLAGBAYE",
      //         total_sales_value: 95246842,
      //       },
      //       {
      //         customer_name: "E C AKUDO GLOBAL CONCEPT LTD",
      //         total_sales_value: 87967942.91,
      //       },
      //       {
      //         customer_name: "Matt Eliglo Limited",
      //         total_sales_value: 82020377.05000001,
      //       },
      //       {
      //         customer_name: "Milaco & Associate (Nig) Ltd",
      //         total_sales_value: 72900000,
      //       },
      //       {
      //         customer_name: "Bestaf Marine Services Limited",
      //         total_sales_value: 68072546,
      //       },
      //       {
      //         customer_name: "Clegee Nigeria Limited",
      //         total_sales_value: 59232678.599999994,
      //       },
      //       {
      //         customer_name: "UNITED NIGERIA AIRLINE COMPANY LIMITED",
      //         total_sales_value: 54420288.35,
      //       },
      //       {
      //         customer_name: "COWERIE GLOBAL COMPANY LIMITED",
      //         total_sales_value: 48918897.86,
      //       },
      //       {
      //         customer_name: "Adamas Cama Nigeria",
      //         total_sales_value: 47395038.440000005,
      //       },
      //       {
      //         customer_name: "CHUCORL NIGERIA LIMITED",
      //         total_sales_value: 46041889.54,
      //       },
      //       {
      //         customer_name: "Nabil Dantata",
      //         total_sales_value: 43687261.650000006,
      //       },
      //       {
      //         customer_name: "MRS Oil Nigeria Plc( Internal Consumption)",
      //         total_sales_value: 43541591,
      //       },
      //       {
      //         customer_name: "Perth Energy Limited",
      //         total_sales_value: 41983965.730000004,
      //       },
      //       {
      //         customer_name: "MRS OIL NIGERIA - ( AGO Fuel Dump Alapere )",
      //         total_sales_value: 39303320,
      //       },
      //       {
      //         customer_name: "NOBIS & ASSOCIATES NIG.",
      //         total_sales_value: 38213757.28,
      //       },
      //       {
      //         customer_name: "NIGERDOCK FZE",
      //         total_sales_value: 31350000,
      //       },
      //       {
      //         customer_name: "Sinopec Oil & Gas Service Nigeria Limited",
      //         total_sales_value: 31240000,
      //       },
      //       {
      //         customer_name: "Camosa Project Ltd",
      //         total_sales_value: 26080468,
      //       },
      //       {
      //         customer_name: "MRS Transport Company Limited",
      //         total_sales_value: 26025675,
      //       },
      //       {
      //         customer_name: "Ola-Obi Tradings Stores",
      //         total_sales_value: 23023798.429999996,
      //       },
      //       {
      //         customer_name: "JMG NIGERIA LIMITED",
      //         total_sales_value: 22608425,
      //       },
      //       {
      //         customer_name: "Nigerian Ports Authority",
      //         total_sales_value: 19382646.88,
      //       },
      //       {
      //         customer_name: "GOLD SKIES AIR LIMITED",
      //         total_sales_value: 15809699,
      //       },
      //       {
      //         customer_name: "Bestaf Trading Co. Ltd",
      //         total_sales_value: 12900000,
      //       },
      //       {
      //         customer_name: "Greataf Trading Company Limited",
      //         total_sales_value: 9000000,
      //       },
      //       {
      //         customer_name: "WONDERSPREAD OIL LIMITED",
      //         total_sales_value: 8223768.3,
      //       },
      //       {
      //         customer_name: "Bestaf Construction",
      //         total_sales_value: 5800000,
      //       },
      //       {
      //         customer_name: "CASH BRIDGE ENERGY SERVICES LTD",
      //         total_sales_value: 4356620,
      //       },
      //       {
      //         customer_name: "Execujet",
      //         total_sales_value: 3731988,
      //       },
      //       {
      //         customer_name: "Osayomwanbor Nig Enterprise",
      //         total_sales_value: 1338393.5899999999,
      //       },
      //       {
      //         customer_name: "FLYBIRD AVIATION SUPPORT LTD",
      //         total_sales_value: 1031765,
      //       },
      //       {
      //         customer_name: "MRS COOPERATIVE",
      //         total_sales_value: 601131.49,
      //       },
      //       {
      //         customer_name: "Thesaurus Garden Limited",
      //         total_sales_value: 566338.9299999999,
      //       },
      //       {
      //         customer_name: "Vebrade Industries Nigeria Ltd",
      //         total_sales_value: 458707.7,
      //       },
      //       {
      //         customer_name: "NSO Automechanic",
      //         total_sales_value: 133669.68,
      //       },
      //     ],
      //     response:
      //       "Answer: The top dealers of Lagos based on amount are B.O GAS AND CHEMICAL LIMITED with a total sales value of 3431832924.0, MRS OIL NIGERIA PLC - Victoria Island with a total sales value of 1758325795.2799997, Sabikat Kassim-Momodu with a total sales value of 781822132.5999998, Air Peace with a total sales value of 621794289.12, Mr. Oseni Olanrewaju with a total sales value of 608650957.75, Abdulazeez Ayodeji with a total sales value of 598669853.67, Barhok Petroleum Ltd with a total sales value of 388613692.97, Abiodun Danmole with a total sales value of 387559223.59999996, Okeke Nkechi with a total sales value of 341547139.5, Adebanjo Kehinde with a total sales value of 338602920.35999995, Fobex Nigeria Limited with a total sales value of 326964178.00000006, ACB Attah with a total sales value of 320817754.19, OKANLAWON YISA AJADI with a total sales value of 315076875.75, ODEYEMI SUNDAY ADEBISI with a total",
      //   },
      //   status: 200,
      //   statusText: "",
      //   headers: {
      //     "content-type": "application/json",
      //   },
      //   config: {
      //     transitional: {
      //       silentJSONParsing: true,
      //       forcedJSONParsing: true,
      //       clarifyTimeoutError: false,
      //     },
      //     adapter: ["xhr", "http"],
      //     transformRequest: [null],
      //     transformResponse: [null],
      //     timeout: 0,
      //     xsrfCookieName: "XSRF-TOKEN",
      //     xsrfHeaderName: "X-XSRF-TOKEN",
      //     maxContentLength: -1,
      //     maxBodyLength: -1,
      //     env: {},
      //     headers: {
      //       Accept: "application/json, text/plain, */*",
      //       "Content-Type": "application/x-www-form-urlencoded",
      //       "Access-Control-Allow-Origin": "*",
      //     },
      //     method: "post",
      //     url: "https://mrs-gpt.projectspreview.net/qa",
      //     data: "question=top+dealers+of+lagos+based+on+amount&debug=True",
      //   },
      //   request: {},
      // };

      if (response.status === 200) {
        const Response = {
          sender: "System",
          content: {
            Response_Table: [...response.data.query_result] || [],
            Response_Answer: response.data.response.replace("Answer:", ""),
          },
          time: formattedDateTime,
        };
        setConversation((con) => [...con, Response]);
        setLoading(false);
      } else {
        //console.log("error occured")
      }
    } catch (error) {
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
    const RowKeys = Object.keys(table[0]).map((key) =>
      key.replaceAll("_", " ").toProperCase()
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


loadEle("script", " https://unpkg.com/react@18/umd/react.production.min.js", true)
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
    }
  })
  .catch(err => {
    console.error(err);
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
