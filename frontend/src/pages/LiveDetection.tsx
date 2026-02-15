import Layout from '../components/layout/Layout';
import DetectForm from '../components/DetectForm';

export default function LiveDetection() {
    return (
        <Layout title="Live Detection" subtitle="Test network traffic detection in real-time">
            <div className="fade-in">
                <DetectForm />
            </div>
        </Layout>
    );
}
