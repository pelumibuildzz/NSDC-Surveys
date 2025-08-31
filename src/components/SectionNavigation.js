import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faUser,
  faIndustry,
  faFlask,
  faChartBar,
  faBullseye,
  faComment,
} from "@fortawesome/free-solid-svg-icons";

const sectionIcons = {
  section1: faUser,
  section2: faIndustry,
  section3: faFlask,
  section4: faChartBar,
  section5: faBullseye,
  section6: faComment,
};

export default function SectionNavigation({
  sections,
  currentSection,
  onSectionChange,
  completedSections,
  isMobile = false,
}) {
  if (isMobile) {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Section {currentSection.replace("section", "")} of {sections.length}
          </div>
          <div className="text-sm font-medium text-gray-900">
            {sections.find((s) => s.id === currentSection)?.title}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 px-2">
        Survey Sections
      </h3>
      <nav className="space-y-3">
        {sections.map((section, index) => {
          const isActive = currentSection === section.id;
          const isCompleted = completedSections.includes(section.id);
          const isAccessible =
            index === 0 || completedSections.includes(sections[index - 1]?.id);

          return (
            <button
              key={section.id}
              onClick={() => isAccessible && onSectionChange(section.id)}
              disabled={!isAccessible}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 border-l-4 border-blue-500"
                  : isCompleted
                  ? "bg-green-50 hover:bg-green-100"
                  : "hover:bg-gray-50"
              } ${!isAccessible ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <FontAwesomeIcon icon={faCheck} className="text-sm" />
                  ) : (
                    <FontAwesomeIcon
                      icon={sectionIcons[section.id]}
                      className="text-sm"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-medium truncate ${
                      isActive
                        ? "text-blue-900"
                        : isCompleted
                        ? "text-green-900"
                        : "text-gray-900"
                    }`}
                  >
                    {section.title}
                  </div>
                  <div
                    className={`text-sm ${
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {section.questions.length} question
                    {section.questions.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
