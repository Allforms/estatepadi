import React, { useState } from "react";
import {
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle,
  // AlertCircle,
  MessageCircle,
  FileText,
  Bug,
  CreditCard,
  Users,
  HelpCircle,
} from "lucide-react";
import api from "../api";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const ContactSupport: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  const supportCategories = [
    {
      id: "billing",
      name: "Billing & Payments",
      icon: <CreditCard size={24} />,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Payment issues, invoices, refunds"
    },
    {
      id: "technical",
      name: "Technical Issue",
      icon: <Bug size={24} />,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Bugs, performance, technical problems"
    },
    {
      id: "account",
      name: "Account Management",
      icon: <Users size={24} />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Profile, settings, access issues"
    },
    {
      id: "general",
      name: "General Inquiry",
      icon: <HelpCircle size={24} />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Questions, feedback, suggestions"
    },
  ];

  const priorityOptions = [
    {
      value: "low",
      label: "Low",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      description: "General questions, non-urgent matters"
    },
    {
      value: "medium",
      label: "Medium",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Important issues, need attention soon"
    },
    {
      value: "high",
      label: "High",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      description: "Significant problems affecting usage"
    },
    {
      value: "urgent",
      label: "Urgent",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Critical issues requiring immediate help"
    },
  ];

  const handlePhoneCall = () => {
    window.open("tel:+2348137343312", "_self");
  };

  const handleEmailContact = () => {
    const subject = "Support Request";
    const body = "Hello,\n\nI need assistance with:\n\n[Please describe your issue here]\n\nBest regards";
    window.open(`mailto:founders@allformslimited.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_self");
  };

  const contactMethods = [
    {
      title: "Live Chat",
      description: "Chat with our support team",
      icon: <MessageCircle size={28} className="text-blue-600" />,
      availability: "Coming Soon",
      bgColor: "bg-blue-50",
      action: "Start Chat",
      actionColor: "bg-gray-400 cursor-not-allowed",
      onClick: () => {},
    },
    {
      title: "Phone Support",
      description: "+234 (0) 813 734 3312",
      icon: <Phone size={28} className="text-green-600" />,
      availability: "Mon-Fri 9AM-6PM",
      bgColor: "bg-green-50",
      action: "Call Now",
      actionColor: "bg-green-600 hover:bg-green-700",
      onClick: handlePhoneCall,
    },
    {
      title: "Email Support",
      description: "founders@allformslimited.com",
      icon: <Mail size={28} className="text-orange-600" />,
      availability: "Response within 24hrs",
      bgColor: "bg-orange-50",
      action: "Send Email",
      actionColor: "bg-orange-600 hover:bg-orange-700",
      onClick: handleEmailContact,
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate priority is selected
    if (!formData.priority) {
      alert("Please select a priority level for your support request.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/contact-support/", {
        name: "Anonymous User",
        email: formData.email,
        subject: formData.subject,
        message: `
            Category: ${selectedCategory || "Not specified"}
            Priority: ${formData.priority}
            Phone: ${formData.phone || "Not provided"}

            Message:
            ${formData.message}
        `,
      });

      if (response.status !== 201 && response.status !== 200) {
        throw new Error("Failed to send message");
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("There was an error sending your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }

    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        subject: "",
        message: "",
        priority: "",
        email: "",
        phone: "",
      });
      setSelectedCategory("");
    }, 3000);
  };

  if (isSubmitted) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="space-y-6 animate-fade-in">
            <div className="text-center px-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact Support</h1>
              <p className="mt-2 text-sm sm:text-base text-gray-500">
                We're here to help you with any questions or issues
              </p>
            </div>

            <div className="max-w-md mx-auto px-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 text-center transform scale-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-once">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  Message Sent Successfully!
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  We've received your support request and will get back to you
                  within 24 hours.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Ticket ID:{" "}
                    <span className="font-mono font-medium">
                      #SP-{Math.random().toString(36).substr(2, 8).toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center px-4 animate-slide-down">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-6">
              Contact Support
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
              We're here to help you with any questions or issues. Choose how you'd like to get in touch.
            </p>
          </div>

          {/* Quick Contact Methods */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className={`${method.bgColor} rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center mb-4 sm:mb-6">
                  {method.icon}
                </div>
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-4">
                    {method.title}
                  </h3>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-700 mb-3 sm:mb-4 font-medium break-words">
                    {method.description}
                  </p>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4 sm:mb-6 flex items-center justify-center">
                    <Clock size={14} className="mr-2 flex-shrink-0" />
                    <span>{method.availability}</span>
                  </p>
                  <button
                    onClick={method.onClick}
                    className={`w-full text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base lg:text-lg font-semibold transition-all duration-200 ${method.actionColor}`}
                  >
                    {method.action}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Support Request Form */}
          <div className="bg-white shadow-xl sm:shadow-2xl rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden animate-fade-in">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
                <FileText size={24} className="mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
                <span>Submit Support Request</span>
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-2 sm:mt-3">
                Fill out the details below and we'll get back to you as soon as possible
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
              {/* Category Selection */}
              <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <label className="block text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-6">
                  What can we help you with?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                  {supportCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setFormData(prev => ({
                          ...prev,
                          subject: category.name
                        }));
                      }}
                      className={`
                        p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1
                        ${
                          selectedCategory === category.id
                            ? `${category.bgColor} ${category.borderColor} ${category.color} shadow-lg transform -translate-y-1`
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }
                      `}
                    >
                      <div className="flex items-center justify-center mb-3 sm:mb-4">
                        {category.icon}
                      </div>
                      <div className="text-center">
                        <h4 className="font-bold text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">
                          {category.name}
                        </h4>
                        <p className="text-xs sm:text-sm opacity-80">{category.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div>
                  <label className="block text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base lg:text-lg border-2 border-gray-300 rounded-lg sm:rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                    Phone Number <span className="text-gray-500 font-normal text-xs sm:text-sm">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base lg:text-lg border-2 border-gray-300 rounded-lg sm:rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="+234 (0) 123 456 7890"
                  />
                </div>
              </div>

              {/* Subject and Priority */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="lg:col-span-2">
                  <label className="block text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base lg:text-lg border-2 border-gray-300 rounded-lg sm:rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                    Priority
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPriorityModal(true)}
                    className={`w-full px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base lg:text-lg border-2 rounded-lg sm:rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-left ${
                      formData.priority
                        ? "border-gray-300 text-gray-900"
                        : "border-gray-300 text-gray-500"
                    }`}
                  >
                    {formData.priority
                      ? priorityOptions.find(p => p.value === formData.priority)?.label
                      : "Select priority"}
                  </button>
                </div>
              </div>

              {/* Message */}
              <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <label className="block text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                  Message
                </label>
                <textarea
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base lg:text-lg border-2 border-gray-300 rounded-lg sm:rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                  placeholder="Please provide detailed information about your issue or question..."
                />
              </div>

              {/* Priority Alert
              {formData.priority === "urgent" && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-6 animate-shake">
                  <div className="flex">
                    <AlertCircle
                      size={20}
                      className="text-red-500 mr-2 sm:mr-3 flex-shrink-0 mt-1"
                    />
                    <div>
                      <h4 className="text-sm sm:text-base lg:text-lg font-bold text-red-800 mb-1 sm:mb-2">
                        Urgent Priority Selected
                      </h4>
                      <p className="text-xs sm:text-sm lg:text-base text-red-700">
                        For urgent issues, consider using our live chat or phone
                        support for faster assistance.
                      </p>
                    </div>
                  </div>
                </div>
              )} */}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      subject: "",
                      message: "",
                      priority: "",
                      email: "",
                      phone: "",
                    });
                    setSelectedCategory("");
                  }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 rounded-lg sm:rounded-xl shadow-sm text-sm sm:text-base lg:text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 border border-transparent rounded-lg sm:rounded-xl shadow-lg text-sm sm:text-base lg:text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2 sm:mr-3" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* FAQ Section */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-gray-200 animate-fade-in">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center justify-center text-center">
              <HelpCircle size={28} className="mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
              <span>Frequently Asked Questions</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {[
                {
                  q: "How do I reset my password?",
                  a: "You can reset your password from the login page using the 'Forgot Password' link."
                },
                {
                  q: "How do I update payment information?",
                  a: "Go to your profile settings and navigate to the billing section to update payment details."
                },
                {
                  q: "What are your support hours?",
                  a: "Our phone support is available Mon-Fri 9AM-6PM. Live chat and email support are available 24/7."
                },
                {
                  q: "How long does it take to get a response?",
                  a: "Email responses typically take 24 hours. Live chat and phone support provide immediate assistance."
                }
              ].map((faq, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <h4 className="font-bold text-base sm:text-lg lg:text-xl text-gray-900 mb-2 sm:mb-3">
                    {faq.q}
                  </h4>
                  <p className="text-sm sm:text-base text-gray-600">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Priority Selection Modal */}
      {showPriorityModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowPriorityModal(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Select Priority Level
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {priorityOptions.map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, priority: priority.value }));
                          setShowPriorityModal(false);
                        }}
                        className={`
                          p-4 sm:p-5 rounded-lg sm:rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1
                          ${
                            formData.priority === priority.value
                              ? `${priority.bgColor} ${priority.borderColor} ${priority.color} shadow-lg transform -translate-y-1`
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                          }
                        `}
                      >
                        <div className="text-center sm:text-left">
                          <h4 className={`font-bold text-base sm:text-lg mb-1 sm:mb-2 ${
                            formData.priority === priority.value ? priority.color : "text-gray-900"
                          }`}>
                            {priority.label}
                          </h4>
                          <p className="text-xs sm:text-sm opacity-80">{priority.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 sm:mt-6">
                    <button
                      type="button"
                      onClick={() => setShowPriorityModal(false)}
                      className="w-full inline-flex justify-center rounded-lg sm:rounded-xl border-2 border-gray-300 shadow-sm px-4 py-2 sm:py-3 bg-white text-sm sm:text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes bounce-once {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
        
        .animate-bounce-once {
          animation: bounce-once 1s ease-in-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default ContactSupport;