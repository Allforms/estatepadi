import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";


interface Section {
  id: string;
  name: string;
}

const sections: Section[] = [
  { id: "terms", name: "Terms of Service" },
  { id: "privacy", name: "Privacy Policy" },
];

export default function PoliciesLayout() {
  const [activeId, setActiveId] = useState<string>("terms");
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        if (!entries || entries.length === 0) return;

        // Sort entries by their position on the page
        const sortedEntries = [...entries].sort((a, b) => {
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });

        // Find the entry that's most visible
        let mostVisible: IntersectionObserverEntry | null = null;
        let maxRatio = 0;

        for (const entry of sortedEntries) {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisible = entry;
          }
        }

        // If we have a most visible section, set it as active
        if (mostVisible && mostVisible.target instanceof HTMLElement && mostVisible.target.id) {
          setActiveId(mostVisible.target.id);
        }
        // If no sections are intersecting, check which one is closest to the top
        else {
          const viewportCenter = window.innerHeight / 2;
          let closestSection: string | null = null;
          let smallestDistance = Infinity;

          for (const section of sections) {
            const element = document.getElementById(section.id);
            if (element) {
              const rect = element.getBoundingClientRect();
              const distance = Math.abs(rect.top - viewportCenter);
              if (distance < smallestDistance) {
                smallestDistance = distance;
                closestSection = section.id;
              }
            }
          }

          if (closestSection) {
            setActiveId(closestSection);
          }
        }
      },
      { 
        rootMargin: "-100px 0px -200px 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
      }
    );

    // Observe all sections
    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) {
        sectionRefs.current[section.id] = el;
        observer.observe(el);
      }
    }

    // Track scroll progress
    const handleScroll = (): void => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));

      // Manual backup check for active section
      const viewportTop = window.pageYOffset + 200;
      let currentSection = sections[0]?.id ?? "terms";

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= viewportTop) {
          currentSection = section.id;
        }
      }

      setActiveId((prev: string) => prev !== currentSection ? currentSection : prev);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      for (const section of sections) {
        const el = sectionRefs.current[section.id];
        if (el) observer.unobserve(el);
      }
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (id: string): void => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.offsetTop - offset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
      
      setActiveId(id);
    }
  };

  return (
    <>
      <Navbar />
      
      {/* Progress bar */}
      {/* <div className="fixed top-[73px] left-0 w-full h-1 bg-gray-100 z-40">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div> */}

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-10 min-h-[calc(100vh-200px)]" ref={containerRef}>
        {/* Enhanced Sidebar */}
        <aside className="w-full lg:w-1/4 lg:sticky lg:top-24 h-fit">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Contents
            </h3>
            <nav className="space-y-2">
              {sections.map((section: Section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                    activeId === section.id
                      ? "bg-blue-50 text-blue-700 font-medium shadow-sm border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{section.name}</span>
                    {activeId === section.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  {/* Active indicator bar */}
                  <div className={`absolute left-0 top-0 w-1 h-full bg-blue-500 transition-all duration-200 ${
                    activeId === section.id ? "opacity-100" : "opacity-0"
                  }`} />
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>
              ))}
            </nav>
            
            {/* Mini progress indicator */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex-1 bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${scrollProgress}%` }}
                  />
                </div>
                <span>{Math.round(scrollProgress)}%</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Active: {sections.find((s: Section) => s.id === activeId)?.name ?? 'Unknown'}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="w-full lg:w-3/4 space-y-16">
          {/* Terms of Service */}
          <section id="terms" className="scroll-mt-28">
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Terms of Use</h2>
              </div>
              
              <div className="prose prose-gray max-w-none">
                <p className="mb-4 text-gray-700 text-lg leading-relaxed">
                  These Terms of Service ("Terms") govern your access to and use of EstatePadi.
                </p>

                <p className="mb-4 text-gray-700 leading-relaxed">
                  Welcome to EstatePadi ("we," "us," or "our") operated by Allforms. These Terms of Use & Privacy Policy ("Terms") govern your access and use of our mobile web platform available at{" "}
                  <a href="https://estatepadi.com" className="text-blue-600 underline hover:text-blue-800 transition-colors" target="_blank" rel="noopener noreferrer">
                    https://estatepadi.com
                  </a>{" "}
                  and any related services (collectively, the "Platform").
                </p>

                <p className="mb-6 text-gray-700 leading-relaxed">
                  By using our Platform, you agree to these Terms. If you do not agree, please discontinue use immediately, as continued use of the Service connotes acceptance, which automatically binds you to the terms.
                </p>

                <div className="space-y-8">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">1. Who Can Use the Platform</h3>
                    <p className="text-gray-700 leading-relaxed">
                      You must be at least 18 years old and legally capable of entering into binding agreements to use the Platform.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">2. Services We Provide</h3>
                    <p className="text-gray-700 mb-3 leading-relaxed">Our Platform enables estate managers, residents, and landlords to:</p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                      <li>Access a seamless estate management system that streamlines residency needs</li>
                      <li>Upload receipts of estate dues</li>
                      <li>Approve or acknowledge estate dues</li>
                      <li>Allow estate managers to verify residents' status</li>
                      <li>Communicate and broadcast messages to tenants/residents</li>
                      <li>Generate gate access codes for estate security</li>
                      <li>Access details and information related to the estate</li>
                      <li>Monitor estate-related activities and administrative updates</li>
                      <li>Verify generated codes for security access</li>
                    </ul>
                    <p className="text-gray-700 mt-3 leading-relaxed">We may improve or update features from time to time.</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">3. Your Account Responsibilities</h3>
                    <p className="text-gray-700 mb-3 leading-relaxed">By creating an account, you agree to:</p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                      <li>Provide true and accurate information</li>
                      <li>Keep your login credentials secure</li>
                      <li>Promptly update your profile if anything changes</li>
                      <li>Use the Platform only for lawful purposes</li>
                    </ul>
                    <p className="text-gray-700 mt-3 leading-relaxed">
                      Do not use another user's account, impersonate anyone, or post harmful content. You will be legally bound by the consequences of such actions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy Policy */}
          <section id="privacy" className="scroll-mt-28">
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Privacy Policy</h2>
              </div>
              
              <div className="prose prose-gray max-w-none">
                <p className="mb-6 text-gray-700 text-lg leading-relaxed">
                  This Privacy Policy explains how EstatePadi collects, uses, and protects your information in line with the Nigeria Data Protection Regulation (NDPR).
                </p>

                <div className="space-y-8">
                  {[
                    {
                      title: "4.1 Information We Collect",
                      content: (
                        <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                          <li>Personal information: Name, email, phone number, address, etc.</li>
                          <li>Estate-related data: Receipts, house address, house type, payment history</li>
                          <li>Technical data: Browser, IP address, cookies</li>
                        </ul>
                      )
                    },
                    {
                      title: "4.2 How We Use Your Information",
                      content: (
                        <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                          <li>Facilitate your access to the Platform</li>
                          <li>Process and verify payments</li>
                          <li>Manage estate communications</li>
                          <li>Improve Platform features</li>
                          <li>Comply with legal obligations</li>
                        </ul>
                      )
                    },
                    {
                      title: "4.3 Lawful Basis for Processing",
                      content: (
                        <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                          <li>Your consent (e.g., when registering)</li>
                          <li>Performance of a contract (e.g., managing your estate profile)</li>
                          <li>Legitimate interest (e.g., improving user experience)</li>
                          <li>Legal obligation (e.g., financial compliance, NDPR)</li>
                        </ul>
                      )
                    },
                    {
                      title: "4.4 Data Sharing",
                      content: (
                        <>
                          <p className="text-gray-700 mb-3 leading-relaxed">We do not sell your data. We may share it with:</p>
                          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                            <li>Estate administrators or property managers</li>
                            <li>Trusted third-party service providers (e.g., payment processors)</li>
                            <li>Government or regulatory bodies as required by law</li>
                          </ul>
                          <p className="text-gray-700 mt-3 leading-relaxed">
                            All partners are obligated to maintain data confidentiality.
                          </p>
                        </>
                      )
                    },
                    {
                      title: "4.5 Data Security",
                      content: (
                        <>
                          <p className="text-gray-700 mb-3 leading-relaxed">
                            We use industry-standard security controls, including:
                          </p>
                          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                            <li>Encrypted communication</li>
                            <li>Access control and authentication</li>
                            <li>Routine security audits</li>
                          </ul>
                          <p className="text-gray-700 mt-3 leading-relaxed">
                            However, no system is 100% secure.
                          </p>
                        </>
                      )
                    },
                    {
                      title: "4.6 Data Retention",
                      content: (
                        <>
                          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                            <li>Account data: Until account is deleted or inactive for 12 months</li>
                            <li>Payment records: As per financial regulations</li>
                            <li>Communication logs: Retained for transparency</li>
                          </ul>
                          <p className="text-gray-700 mt-3 leading-relaxed">
                            You may request deletion or correction at any time.
                          </p>
                        </>
                      )
                    },
                    {
                      title: "4.7 Your Data Rights",
                      content: (
                        <>
                          <p className="text-gray-700 mb-3 leading-relaxed">Under NDPR, you have the right to:</p>
                          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                            <li>Access your data</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Object to processing in certain cases</li>
                            <li>Withdraw consent at any time</li>
                            <li>Request deletion ("Right to be Forgotten")</li>
                          </ul>
                          <p className="text-gray-700 mt-3 leading-relaxed">
                            To exercise these rights, contact:{" "}
                            <a
                              href="mailto:founders@allformslimited.com"
                              className="text-blue-600 underline hover:text-blue-800 transition-colors"
                            >
                              founders@allformslimited.com
                            </a>
                          </p>
                        </>
                      )
                    },
                    {
                      title: "4.8 Cookies and Tracking",
                      content: (
                        <>
                          <p className="text-gray-700 mb-3 leading-relaxed">We use cookies to:</p>
                          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                            <li>Enhance user experience</li>
                            <li>Keep you logged in</li>
                            <li>Track usage patterns</li>
                          </ul>
                          <p className="text-gray-700 mt-3 leading-relaxed">
                            You can manage cookies via your browser settings.
                          </p>
                        </>
                      )
                    }
                  ].map(({ title, content }) => (
                    <div key={title} className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">{title}</h3>
                      {content}
                    </div>
                  ))}

                  {/* Additional sections */}
                  {[
                    {
                      title: "5. Intellectual Property",
                      content:
                        "All content, code, branding, and functionality on this Platform are our property or licensed to us. You may not reuse or distribute any part without written permission from AllForms.",
                    },
                    {
                      title: "6. Account Termination",
                      content:
                        "We reserve the right to suspend or delete your account if you violate these Terms, engage in fraud, or are inactive.",
                    },
                    {
                      title: "7. Limitation of Liability",
                      content:
                        "We are not liable for service interruptions, third-party issues, user errors, or financial mishaps from processors.",
                    },
                    {
                      title: "8. Indemnification",
                      content:
                        "You agree to indemnify us from any losses due to your misuse of the Platform, legal violations, or third-party claims.",
                    },
                    {
                      title: "9. Modifications",
                      content:
                        "We may update these Terms. We'll update the effective date and notify you. Continued use means acceptance.",
                    },
                    {
                      title: "10. Governing Law",
                      content: "These Terms are governed by the laws of the Federal Republic of Nigeria.",
                    },
                    {
                      title: "11. Dispute Resolution",
                      content:
                        "Disputes unresolved after 30 days of negotiation shall be referred to arbitration in Lagos under the Arbitration and Mediation Act, 2023.",
                    },
                  ].map(({ title, content }) => (
                    <div key={title} className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">{title}</h3>
                      <p className="text-gray-700 leading-relaxed">{content}</p>
                    </div>
                  ))}

                  {/* Contact section */}
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">12. Contact Us</h3>
                    <p className="text-gray-700 mb-3 leading-relaxed">If you have any questions, please contact us:</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a
                          href="mailto:founders@allformslimited.com"
                          className="text-blue-600 underline hover:text-blue-800 transition-colors break-all sm:break-normal"
                        >
                          founders@allformslimited.com
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href="tel:+2348137343312" className="text-blue-600 underline hover:text-blue-800 transition-colors">
                          +234 813 734 3312
                        </a>
                      </div>
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-700">No. 52, Victory Avenue, Ojodu, Lagos.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </>
  );
}