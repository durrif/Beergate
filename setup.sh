#!/bin/bash

# Beergate Setup Script
# Quick setup for development environment

echo "🍺 Beergate - Setup Script"
echo "=========================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Copy .env.example if .env doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env from .env.example..."
    cp backend/.env.example backend/.env
    
    # Generate random SECRET_KEY and JWT_SECRET_KEY
    SECRET_KEY=$(openssl rand -hex 32)
    JWT_SECRET_KEY=$(openssl rand -hex 32)
    
    # Update .env with generated keys
    sed -i "s/SECRET_KEY=your-secret-key-here-change-in-production/SECRET_KEY=${SECRET_KEY}/" backend/.env
    sed -i "s/JWT_SECRET_KEY=your-jwt-secret-key-change-in-production/JWT_SECRET_KEY=${JWT_SECRET_KEY}/" backend/.env
    
    echo "✅ Generated secure keys for backend/.env"
else
    echo "⚠️  backend/.env already exists. Skipping..."
fi

echo ""
echo "🐳 Starting Docker Compose services..."
echo "This may take a few minutes on first run..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "📊 Running database migrations..."
docker-compose exec -T backend alembic upgrade head

echo ""
echo "📦 Loading initial data (maltas inventory)..."
docker-compose exec -T backend python scripts/load_initial_data.py

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Access the application:"
echo "   - Frontend:       http://localhost:5173"
echo "   - API Docs:       http://localhost:8000/docs"
echo "   - Flower (Celery): http://localhost:5555"
echo ""
echo "🔑 Default credentials:"
echo "   Email:    admin@beergate.com"
echo "   Password: admin123"
echo ""
echo "⚠️  Remember to change these in production!"
echo ""
echo "📋 Useful commands:"
echo "   View logs:        docker-compose logs -f backend"
echo "   Stop services:    docker-compose down"
echo "   Restart:          docker-compose restart"
echo ""
echo "🍺 Happy brewing!"
