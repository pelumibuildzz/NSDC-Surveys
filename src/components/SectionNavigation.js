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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Survey Sections
      </h3>
      <nav className="space-y-2">
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
              className={`section-nav-item w-full text-left ${
                isActive ? "active" : isCompleted ? "completed" : ""
              } ${!isAccessible ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? "bg-green-100 text-green-600"
                      : isActive
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-400"
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
                <div>
                  <div className="font-medium">{section.title}</div>
                  <div className="text-sm text-gray-500">
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
