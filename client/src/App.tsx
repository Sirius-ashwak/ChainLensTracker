import { Switch, Route } from "wouter";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Datasets from "@/pages/Datasets";
import DatasetDetails from "@/pages/DatasetDetails";
import Models from "@/pages/Models";
import Lineage from "@/pages/Lineage";
import Verification from "@/pages/Verification";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/datasets" component={Datasets} />
        <Route path="/datasets/:id" component={DatasetDetails} />
        <Route path="/models" component={Models} />
        <Route path="/lineage" component={Lineage} />
        <Route path="/verification" component={Verification} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default App;
