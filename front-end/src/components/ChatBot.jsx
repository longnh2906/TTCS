import robot_img from "../assets/robot_image.png";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function ChatBot() {
  const messagesEndRef = useRef(null);
  const [timeOfRequest, setTimeOfRequest] = useState(0);
  const [promptInput, setPromptInput] = useState("");
  const [sourceData] = useState("ptit");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGen, setIsGen] = useState(false);
  const [dataChat, setDataChat] = useState([
    ["start", [
      "Xin chào! Đây là Chatbot Pháp luật đại cương của PTIT, trợ lý đắc lực dành cho bạn! Bạn muốn tìm kiếm thông tin về những gì? Mình sẽ tham khảo từ Giáo trình Pháp luật đại cương - Học viện Công nghệ Bưu chính Viễn thông để trả lời bạn nhé. 😄",
      null
    ]]
  ]);

  useEffect(() => {
    let interval;
    if (isGen) {
      interval = setInterval(() => {
        setTimeOfRequest((prev) => prev + 1);
      }, 1000);
    } else {
      setTimeOfRequest(0);
    }
    return () => clearInterval(interval);
  }, [isGen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dataChat]);

  const handleChange = (e) => setPromptInput(e.target.value);

  const sendMessage = async () => {
    if (!promptInput || isLoading) return;
    setIsGen(true);
    setIsLoading(true);
    setPromptInput("");
    setChatHistory((prev) => [promptInput, ...prev]);
    setDataChat((prev) => [...prev, ["end", [promptInput, sourceData]]]);

    try {
      const res = await fetch(`http://localhost:8000/rag/${sourceData}?q=${promptInput}`);
      const result = await res.json();
      const fullText = result.result;
      const refs = result.source_documents;

      setDataChat((prev) => [...prev, ["start", ["", refs, sourceData]]]);

      let idx = 0;
      const interval = setInterval(() => {
        idx++;
        setDataChat((prev) => {
          const copy = [...prev];
          const last = copy.pop();
          if (last[0] === "start") {
            last[1][0] = fullText.slice(0, idx);
            copy.push(last);
          }
          return copy;
        });
        if (idx >= fullText.length) {
          clearInterval(interval);
          setIsGen(false);
          setIsLoading(false);
        }
      }, 5);
    } catch (err) {
      setDataChat((prev) => [...prev, ["start", ["Lỗi, không thể kết nối với server", null]]]);
      setIsGen(false);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const [reference, setReference] = useState({
    title: "",
    source: "",
    url: "",
    text: "",
  });

  const handleReferenceClick = (src) => {
    setReference({
      title: src.metadata.page == null ? "Giáo trình Pháp luật đại cương" : "Trang " + src.metadata.page,
      source: "Học viện Công nghệ Bưu chính Viễn thông",
      url: "http://dlib.ptit.edu.vn/handle/HVCNBCVT/2129",
      text: src.page_content,
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-100 h-[85vh]">
      <div className="flex justify-center h-[80vh]">
        <input type="checkbox" id="my_modal_6" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{reference.title}</h3>
            <p className="font-normal text-sm">Nguồn: {reference.source}</p>
            <p className="py-4 text-sm">{reference.text.slice(0, 700) + "..."}</p>
            <p className="link link-primary truncate">
              <a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.url}</a>
            </p>
            <div className="modal-action">
              <label htmlFor="my_modal_6" className="btn btn-error">ĐÓNG</label>
            </div>
          </div>
        </div>

        <div className="mt-5 text-sm bg-white rounded-3xl border-2 md:w-[50%] md:p-3 p-1 w-full overflow-auto h-[80%]">
          {dataChat.map((msg, i) =>
            msg[0] === "start" ? (
              <div className="chat chat-start" key={i}>
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full border-2 border-blue-500">
                    <img className="scale-150" src={robot_img} alt="bot" />
                  </div>
                </div>
                <div className="chat-bubble chat-bubble-info break-words max-w-full prose prose-sm">
                  <ReactMarkdown>{msg[1][0]}</ReactMarkdown>
                  {msg[1][1] && msg[1][1].length > 0 && (
                    <>
                      <div className="divider m-0"></div>
                      <p className="font-semibold text-xs">
                        Tham khảo:{" "}
                        {[...new Map(msg[1][1].map((item) => {
                          const page = item.metadata?.page;
                          return [page ?? "default", item];
                        })).values()].map((src, j) => (
                          <label
                            htmlFor="my_modal_6"
                            className="kbd kbd-xs mr-1 hover:bg-sky-300 cursor-pointer"
                            onClick={() => handleReferenceClick(src)}
                            key={j}
                          >
                            {src.metadata?.page == null
                              ? "Giáo trình Pháp luật đại cương"
                              : "Trang " + src.metadata.page}
                          </label>
                        ))}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="chat chat-end" key={i}>
                <div className="chat-bubble shadow-xl chat-bubble-primary bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  {msg[1][0]}
                  <div className="divider m-0"></div>
                  
                </div>
              </div>
            )
          )}
          <div ref={messagesEndRef} />
          <div className="absolute bottom-[0.2rem] md:w-[50%] grid">
            <input
              type="text"
              placeholder="Nhập câu hỏi tại đây..."
              className="mr-1 shadow-xl border-2 focus:outline-none px-2 rounded-2xl input-primary col-start-1 md:col-end-12 col-end-11"
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isGen}
              value={promptInput}
            />
            <button
              disabled={isGen}
              onClick={sendMessage}
              className="drop-shadow-md md:col-start-12 rounded-2xl col-start-11 col-end-12 md:col-end-13 btn btn-active btn-primary btn-square bg-gradient-to-tl from-transparent via-blue-600 to-indigo-500"
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" color="white" height="15px" width="15px" xmlns="http://www.w3.org/2000/svg">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
            <p className="text-xs col-start-1 col-end-12 text-justify p-1">
              <b>Lưu ý:</b> Mô hình có thể đưa ra câu trả lời không chính xác. Hãy kiểm chứng thông tin bạn nhé!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBot;
