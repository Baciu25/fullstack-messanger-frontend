import { useEffect, useState } from "react";

import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [usernameInput, setUsernameInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [temporaryEditingContent, setTemporaryEditingContent] = useState("");
  const [error, setError] = useState(null);

  // WHEN THE APP LOADS, GET ALL MESSAGES
  useEffect(() => {
    // GET REQUEST (POLLING EVERY 1 SECOND)
    setInterval(() => {
      fetch(`${import.meta.env.VITE_MESSAGING_API}/messages`, {
        method: "GET",
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(
              `Something went wrong with polling messages request${res.status}${res.statusText}`
            );
          }
          return res.json();
        })

        .then((data) => setMessages(data))
        .catch((error) => setError(error.message));
    }, 1000);
  }, []);

  // CREATE MESSAGE
  const handleSubmit = (e) => {
    e.preventDefault();

    const message = {
      content: contentInput,
      username: usernameInput,
    };

    fetch(`${import.meta.env.VITE_MESSAGING_API}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Something went wrong with creating messages request${res.status}${res.statusText}`
          );
        }
        return res.json();
      })
      .then((data) => {
        console.log("newDoc received from server", data);
        setMessages([...messages, data]);
      })
      .catch((error) => setError(error.message));
  };

  // DELETE MESSAGE
  const handleDelete = (id) => {
    fetch(`${import.meta.env.VITE_MESSAGING_API}/messages/${id}`, {
      method: "DELETE",
    }).then((response) => {
      if (response.ok && response.status === 204) {
        setMessages(messages.filter((message) => message.id !== id));
      } else {
        setError(
          `Something went wrong with deleting ${response.status} ${response.statusText}`
        );
      }
    });
  };

  const startOrFinishEditing = (id) => {
    if (editingId === id) {
      finishEditingAndSaveChangesInServer();
    } else {
      startEditing(id);
    }
  };

  const startEditing = (id) => {
    setEditingId((previous) => (previous === id ? null : id));
    setTemporaryEditingContent(
      messages.find((message) => message.id === id).content
    );
  };

  const finishEditingAndSaveChangesInServer = () => {
    setEditingId(null);
    fetch(`${import.meta.env.VITE_MESSAGING_API}/messages/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: temporaryEditingContent }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Something went wrong with editing messages request${res.status}${res.statusText}`
          );
        }
        return res.json();
      })

      .then((updatedMessageFromBackend) => {
        setMessages(
          messages.map((message) =>
            message.id === editingId ? updatedMessageFromBackend : message
          )
        );
      });
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {error && <h2 className="text-red-500"> {error} </h2>}
      <h1 className="text-xl mb-4">
        Editing ID: {editingId ? editingId : "null"}
      </h1>

      <div className="space-y-4">
        {messages
          .sort((a, b) => a.created_at - b.created_at)
          .map((message) => {
            return (
              <div
                key={message.id}
                className={`${
                  editingId === message.id
                    ? "bg-white"
                    : "bg-blue-500 text-white"
                } p-4 rounded-lg`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold">{message.username}:</span>
                  <span className="text-sm">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                {editingId === message.id ? (
                  <input
                    value={temporaryEditingContent}
                    onChange={(e) => setTemporaryEditingContent(e.target.value)}
                    name="content"
                    type="text"
                    className="w-full bg-gray-100 border rounded p-1 mt-2"
                  />
                ) : (
                  <p className="mt-2">{message.content}</p>
                )}
                <div className="flex justify-end mt-2 space-x-2">
                  <button
                    onClick={() => handleDelete(message.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Delete 🚮
                  </button>
                  <button
                    onClick={() => startOrFinishEditing(message.id)}
                    className={`${
                      editingId === message.id ? "bg-green-500" : "bg-blue-500"
                    } text-white px-2 py-1 rounded hover:bg-opacity-80`}
                  >
                    {editingId === message.id ? "Save" : "Edit"}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      <form className="mt-4" onSubmit={handleSubmit}>
        <div className="flex space-x-2">
          <input
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            name="username"
            type="text"
            placeholder="Username"
            className="w-1/4 bg-gray-100 border rounded p-1"
          />
          <input
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            name="content"
            type="text"
            placeholder="Message"
            className="w-3/4 bg-gray-100 border rounded p-1"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;
