import React, { useState, useEffect } from "react";
import Select from "react-select";

interface NavHeaderProps {
  onStartNewChat: () => void;
  selectedModel: { label: string; value: string } | null;
  onModelChange: React.Dispatch<
    React.SetStateAction<{ label: string; value: string } | null>
  >;
}

const NavHeader: React.FC<NavHeaderProps> = ({
  onStartNewChat,
  selectedModel,
  onModelChange,
}) => {
  const [models, setModels] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    // Fetch the installed Ollama models
    const fetchModels = async () => {
      try {
        const requestOptions = {
          method: "GET",
          redirect: "follow" as RequestRedirect,
        };
        const response = await fetch(
          "http://localhost:11434/api/tags",
          requestOptions,
        );
        const data = await response.json();
        const modelOptions = data.models.map((model: any) => ({
          label: model.name, // Assuming 'name' is the property you want to display
          value: model.name, // Assuming 'name' is the unique identifier
        }));
        setModels(modelOptions);
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };

    // Fetch the current running model
    const fetchCurrentModel = async () => {
      try {
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "",
            model: "deepseek-r1",
            stream: false,
          }),
        };
        const response = await fetch(
          "http://localhost:11434/api/generate",
          requestOptions,
        );
        const data = await response.json();
        const currentModel = data.model; // Assuming 'model' is the property that contains the current running model name
        onModelChange({ label: currentModel, value: currentModel });
      } catch (error) {
        console.error("Error fetching current model:", error);
      }
    };

    fetchModels();
    fetchCurrentModel();
  }, [onModelChange]);

  const handleModelChange = async (
    selectedOption: { label: string; value: string } | null,
  ) => {
    onModelChange(selectedOption);
    if (selectedOption) {
      try {
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "",
            model: selectedOption.value,
            stream: false,
          }),
        };
        await fetch("http://localhost:11434/api/generate", requestOptions);
      } catch (error) {
        console.error("Error setting current model:", error);
      }
    }
  };

  return (
    <nav className="h-16 border-gray-200 bg-white dark:bg-gray-900">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
        <div className="flex md:order-1">
          <ul className="mt-4 flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-4 font-medium dark:border-gray-700 dark:bg-gray-800 md:mt-0 md:flex-row md:space-x-8 md:border-0 md:bg-white md:p-0 md:dark:bg-gray-900 rtl:space-x-reverse">
            <li>
              <a
                href="#"
                className="block rounded-sm bg-blue-700 px-3 py-2 text-white md:bg-transparent md:p-0 md:text-blue-700 md:dark:text-blue-500"
                aria-current="page"
                onClick={onStartNewChat}
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="size-[22px] text-gray-800 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-width="2"
                      d="M8.737 8.737a21.49 21.49 0 0 1 3.308-2.724m0 0c3.063-2.026 5.99-2.641 7.331-1.3 1.827 1.828.026 6.591-4.023 10.64-4.049 4.049-8.812 5.85-10.64 4.023-1.33-1.33-.736-4.218 1.249-7.253m6.083-6.11c-3.063-2.026-5.99-2.641-7.331-1.3-1.827 1.828-.026 6.591 4.023 10.64m3.308-9.34a21.497 21.497 0 0 1 3.308 2.724m2.775 3.386c1.985 3.035 2.579 5.923 1.248 7.253-1.336 1.337-4.245.732-7.295-1.275M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
                    />
                  </svg>
                  <span>Start New</span>
                </div>
              </a>
            </li>
          </ul>
        </div>
        <div className="ml-auto flex md:order-2">
          <button
            type="button"
            data-collapse-toggle="navbar-search"
            aria-controls="navbar-search"
            aria-expanded="false"
            className="me-1 rounded-lg p-2.5 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700 md:hidden"
          >
            <svg
              className="size-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
            <span className="sr-only">Search</span>
          </button>
          <div className="relative hidden md:block">
            <Select
              options={models}
              value={selectedModel}
              placeholder="Search models..."
              className="w-full"
              onChange={handleModelChange}
            />
          </div>
          <button
            data-collapse-toggle="navbar-search"
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 md:hidden"
            aria-controls="navbar-search"
            aria-expanded="false"
          ></button>
        </div>
      </div>
    </nav>
  );
};

export default NavHeader;
