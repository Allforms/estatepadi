from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Estate, User, VisitorCode
from django.utils import timezone
from datetime import timedelta

class EstateManagementTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.estate = Estate.objects.create(
            name="Test Estate",
            address="123 Test St",
            email="test@estate.com",
            phone_number="1234567890"
        )
        
    def test_user_registration(self):
        data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'confirm_password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '1234567890',
            'estate': self.estate.id,
            'resident_type': 'tenant'
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

class VisitorCodeModelTest(TestCase):

    def setUp(self):
        # Create estate for the user
        self.estate = Estate.objects.create(name="Test Estate", location="Test Location")

        # Create resident user
        self.user = User.objects.create_user(
            email='resident@example.com',
            password='password123',
            role='resident',
            estate=self.estate,
            phone_number='08012345678'
        )

    def test_visitor_code_auto_generates_code(self):
        visitor = VisitorCode.objects.create(
            resident=self.user,
            visitor_name='John Doe'
        )
        self.assertIsNotNone(visitor.code)
        self.assertEqual(len(visitor.code), 10)
        self.assertTrue(visitor.code.isdigit())

    def test_visitor_code_default_expiry(self):
        visitor = VisitorCode.objects.create(
            resident=self.user,
            visitor_name='John Doe'
        )
        expected_expiry = visitor.created_at + timedelta(minutes=10)
        self.assertAlmostEqual(visitor.expires_at, expected_expiry, delta=timedelta(seconds=1))

    def test_visitor_code_is_valid_initially(self):
        visitor = VisitorCode.objects.create(
            resident=self.user,
            visitor_name='John Doe'
        )
        self.assertTrue(visitor.is_valid())

    def test_visitor_code_is_invalid_if_used(self):
        visitor = VisitorCode.objects.create(
            resident=self.user,
            visitor_name='John Doe',
            is_used=True
        )
        self.assertFalse(visitor.is_valid())

    def test_visitor_code_is_invalid_after_expiry(self):
        visitor = VisitorCode.objects.create(
            resident=self.user,
            visitor_name='John Doe',
            expires_at=timezone.now() - timedelta(minutes=1)
        )
        self.assertFalse(visitor.is_valid())

    def test_str_representation(self):
        visitor = VisitorCode.objects.create(
            resident=self.user,
            visitor_name='John Doe'
        )
        expected_str = f"Visitor Code {visitor.code} for {visitor.visitor_name} by {self.user.email}"
        self.assertEqual(str(visitor), expected_str)
