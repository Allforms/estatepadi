import React, { useState } from "react";
import {
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
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
    priority: "medium",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const supportCategories = [
    {
      id: "billing",
      name: "Billing & Payments",
      icon: <CreditCard size={28} />,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Payment issues, invoices, refunds"
    },
    {
      id: "technical",
      name: "Technical Issue",
      icon: <Bug size={28} />,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Bugs, performance, technical problems"
    },
    {
      id: "account",
      name: "Account Management",
      icon: <Users size={28} />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Profile, settings, access issues"
    },
    {
      id: "general",
      name: "General Inquiry",
      icon: <HelpCircle size={28} />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Questions, feedback, suggestions"
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
      icon: <MessageCircle size={32} className="text-blue-600" />,
      availability: "Coming Soon",
      bgColor: "bg-blue-50",
      action: "Start Chat",
      actionColor: "bg-gray-400 cursor-not-allowed",
      onClick: () => {},
    },
    {
      title: "Phone Support",
      description: "+234 (0) 813 734 3312",
      icon: <Phone size={32} className="text-green-600" />,
      availability: "Mon-Fri 9AM-6PM",
      bgColor: "bg-green-50",
      action: "Call Now",
      actionColor: "bg-green-600 hover:bg-green-700",
      onClick: handlePhoneCall,
    },
    {
      title: "Email Support",
      description: "founders@allformslimited.com",
      icon: <Mail size={32} className="text-orange-600" />,
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
    setIsSubmitting(true);

    try {
      const response = await api.post("/api/contact-support/", {
        name: "Anonymous User", // can extend later
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

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        subject: "",
        message: "",
        priority: "medium",
        email: "",
        phone: "",
      });
      setSelectedCategory("");
    }, 3000);
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Contact Support</h1>
          <p className="mt-1 text-sm text-gray-500">
            We're here to help you with any questions or issues
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Message Sent Successfully!
            </h3>
            <p className="text-gray-600 mb-4">
              We've received your support request and will get back to you
              within 24 hours.
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">
                Ticket ID:{" "}
                <span className="font-mono font-medium">
                  #SP-{Math.random().toString(36).substr(2, 8).toUpperCase()}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <Navbar/>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Contact Support</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to help you with any questions or issues. Choose how you'd like to get in touch.
          </p>
        </div>

        {/* Quick Contact Methods */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {contactMethods.map((method, index) => (
            <div
              key={index}
              className={`${method.bgColor} rounded-2xl p-8 border-2 border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="flex items-center justify-center mb-6">
                {method.icon}
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{method.title}</h3>
                <p className="text-lg text-gray-700 mb-4 font-medium">{method.description}</p>
                <p className="text-base text-gray-600 mb-6 flex items-center justify-center">
                  <Clock size={16} className="mr-2" />
                  {method.availability}
                </p>
                <button
                  onClick={method.onClick}
                  className={`w-full text-white px-6 py-4 rounded-xl text-lg font-semibold transition-all duration-200 ${method.actionColor}`}
                >
                  {method.action}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Support Request */}
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText size={32} className="mr-3 text-blue-600" />
              Submit Support Request
            </h2>
            <p className="text-lg text-gray-600 mt-3">
              Fill out the details below and we'll get back to you as soon as possible
            </p>
          </div>

          <div className="p-8 space-y-8">
            {/* Category Selection */}
            <div>
              <label className="block text-xl font-semibold text-gray-900 mb-6">
                What can we help you with?
              </label>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
                {supportCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                    p-6 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1
                    ${
                      selectedCategory === category.id
                        ? `${category.bgColor} ${category.borderColor} ${category.color} shadow-lg transform -translate-y-1`
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }
                  `}
                  >
                    <div className="flex items-center justify-center mb-4">
                      {category.icon}
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-lg mb-2">{category.name}</h4>
                      <p className="text-sm opacity-80">{category.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Phone Number <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="+234 (0) 123 456 7890"
                />
              </div>
            </div>

            {/* Subject and Priority */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Brief description of your issue"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Message
              </label>
              <textarea
                name="message"
                rows={6}
                value={formData.message}
                onChange={handleInputChange}
                required
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Please provide detailed information about your issue or question..."
              />
            </div>

            {/* Priority Alert */}
            {formData.priority === "urgent" && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex">
                  <AlertCircle
                    size={24}
                    className="text-red-500 mr-3 flex-shrink-0"
                  />
                  <div>
                    <h4 className="text-lg font-bold text-red-800 mb-2">
                      Urgent Priority Selected
                    </h4>
                    <p className="text-base text-red-700">
                      For urgent issues, consider using our live chat or phone
                      support for faster assistance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    subject: "",
                    message: "",
                    priority: "medium",
                    email: "",
                    phone: "",
                  });
                  setSelectedCategory("");
                }}
                className="px-8 py-4 border-2 border-gray-300 rounded-xl shadow-sm text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Clear Form
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center px-10 py-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin -ml-1 mr-3 h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} className="mr-3" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border-2 border-gray-200">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center justify-center">
            <HelpCircle size={32} className="mr-3 text-blue-600" />
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300">
              <h4 className="font-bold text-xl text-gray-900 mb-3">
                How do I reset my password?
              </h4>
              <p className="text-base text-gray-600">
                You can reset your password from the login page using the
                "Forgot Password" link.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300">
              <h4 className="font-bold text-xl text-gray-900 mb-3">
                How do I update payment information?
              </h4>
              <p className="text-base text-gray-600">
                Go to your profile settings and navigate to the billing section
                to update payment details.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300">
              <h4 className="font-bold text-xl text-gray-900 mb-3">
                What are your support hours?
              </h4>
              <p className="text-base text-gray-600">
                Our phone support is available Mon-Fri 9AM-6PM. Live chat and
                email support are available 24/7.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300">
              <h4 className="font-bold text-xl text-gray-900 mb-3">
                How long does it take to get a response?
              </h4>
              <p className="text-base text-gray-600">
                Email responses typically take 24 hours. Live chat and phone
                support provide immediate assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
      </main>
    <Footer/>
    </>
  );
};

export default ContactSupport;