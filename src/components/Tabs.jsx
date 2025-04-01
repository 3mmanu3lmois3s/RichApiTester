// src/components/Tabs.jsx
import React, { useReducer, useState } from "react";
import TestApiMock from "./TestApiMock"; // Asegúrate de que la ruta sea correcta

const initialState = {
  tabs: [],
  activeIndex: null,
  nextId: 1,
};

function tabsReducer(state, action) {
  switch (action.type) {
    case "ADD_TAB": {
      const { title, content, type } = action.payload;
      // Para orquestador, permitir solo una pestaña
      if (type === "orch") {
        const existingIndex = state.tabs.findIndex(
          (tab) => tab.type === "orch"
        );
        if (existingIndex !== -1) {
          return { ...state, activeIndex: existingIndex };
        }
      }
      const newTab = {
        id: state.nextId,
        title,
        content,
        type,
      };
      const newTabs = [...state.tabs, newTab];
      return {
        tabs: newTabs,
        activeIndex: newTabs.length - 1,
        nextId: state.nextId + 1,
      };
    }
    case "CLOSE_TAB": {
      const index = action.payload;
      const newTabs = state.tabs.slice();
      newTabs.splice(index, 1);
      let newActiveIndex = state.activeIndex;
      if (state.activeIndex === index) {
        newActiveIndex =
          newTabs.length > 0 ? (index > 0 ? index - 1 : 0) : null;
      } else if (state.activeIndex > index) {
        newActiveIndex = state.activeIndex - 1;
      }
      return { ...state, tabs: newTabs, activeIndex: newActiveIndex };
    }
    case "SET_ACTIVE": {
      return { ...state, activeIndex: action.payload };
    }
    case "EDIT_TAB": {
      const { index, newTitle } = action.payload;
      const updatedTabs = state.tabs.map((tab, i) =>
        i === index ? { ...tab, title: newTitle } : tab
      );
      return { ...state, tabs: updatedTabs };
    }
    default:
      return state;
  }
}

function Tabs() {
  const [state, dispatch] = useReducer(tabsReducer, initialState);

  const addTab = (title, content, type) => {
    dispatch({ type: "ADD_TAB", payload: { title, content, type } });
  };

  const closeTab = (index) => {
    dispatch({ type: "CLOSE_TAB", payload: index });
  };

  const setActive = (index) => {
    dispatch({ type: "SET_ACTIVE", payload: index });
  };

  const handleTitleEdit = (index, newTitle) => {
    dispatch({ type: "EDIT_TAB", payload: { index, newTitle } });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Barra de pestañas con scroll horizontal */}
      <div className="flex overflow-x-auto bg-gray-200 p-2 space-x-1">
        {state.tabs.map((tab, i) => (
          <div
            key={tab.id}
            onClick={() => setActive(i)}
            className={`flex-shrink-0 px-2 py-1 mx-1 cursor-pointer rounded 
              ${
                tab.type === "mock"
                  ? "bg-blue-300 hover:bg-blue-400"
                  : tab.type === "real"
                  ? "bg-green-300 hover:bg-green-400"
                  : "bg-purple-300 hover:bg-purple-400"
              }
              ${i === state.activeIndex ? "bg-white" : ""}`}
            style={{ minWidth: "100px" }}
          >
            <EditableLabel
              initialValue={tab.title}
              onSave={(newTitle) => handleTitleEdit(i, newTitle)}
            />
            <button
              className="ml-1 text-red-500 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(i);
              }}
            >
              ✕
            </button>
          </div>
        ))}
        {/* Botones para agregar nuevas pestañas */}
        <button
          className="flex-shrink-0 ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          onClick={() => addTab("Test API Mock", <TestApiMock />, "mock")}
        >
          +Mock
        </button>
        <button
          className="flex-shrink-0 ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
          onClick={() => addTab("Test API Real", <RealApiView />, "real")}
        >
          +Real
        </button>
        <button
          className="flex-shrink-0 ml-2 px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
          onClick={() => addTab("Orchestrator", <OrchestratorView />, "orch")}
        >
          +Orch
        </button>
      </div>
      {/* Contenido de la pestaña activa */}
      <div className="flex-1 bg-white p-4">
        {state.activeIndex !== null && state.tabs[state.activeIndex] ? (
          state.tabs[state.activeIndex].content
        ) : (
          <p className="text-gray-500">No hay pestañas abiertas</p>
        )}
      </div>
    </div>
  );
}

function EditableLabel({ initialValue, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  return editing ? (
    <input
      type="text"
      className="text-sm"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        setEditing(false);
        onSave(value);
      }}
      autoFocus
    />
  ) : (
    <span onDoubleClick={() => setEditing(true)} className="text-sm">
      {value}
    </span>
  );
}

function RealApiView() {
  return <div>Vista de Real API</div>;
}

function OrchestratorView() {
  return <div>Vista de Orquestador</div>;
}

export default Tabs;
